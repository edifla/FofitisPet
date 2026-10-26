import "server-only";
import { randomUUID } from "node:crypto";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getGateway, simulatedPaymentsAllowed, type GatewayUpdate } from "./index";
import { SIMULATED_PROVIDER } from "./simulated";

// Regras de pagamento dos pedidos (KAN-26), independentes do gateway usado.

export const PIX_TTL_MINUTES = 30;

export class PaymentError extends Error {}

// Pedido do cliente que ainda pode ser pago.
async function payableOrder(userId: string, orderNumber: number) {
  const order = await prisma.order.findFirst({
    where: { number: orderNumber, userId },
    select: {
      id: true,
      number: true,
      status: true,
      totalCents: true,
      user: { select: { email: true } },
    },
  });
  if (!order) throw new PaymentError("Pedido não encontrado.");
  if (order.status !== "PENDING_PAYMENT")
    throw new PaymentError("Este pedido não está aguardando pagamento.");
  return order;
}

// Gera o Pix do pedido (KAN-108). Se já houver um Pix válido e pendente, devolve o mesmo.
export async function startPixPayment(userId: string, orderNumber: number) {
  const order = await payableOrder(userId, orderNumber);
  const gateway = getGateway();

  const current = await prisma.payment.findFirst({
    where: {
      orderId: order.id,
      method: "PIX",
      status: "PENDING",
      provider: gateway.name,
      pixExpiresAt: { gt: new Date() },
    },
    select: { id: true },
  });
  if (current) return current;

  const expiresAt = new Date(Date.now() + PIX_TTL_MINUTES * 60 * 1000);
  const pix = await gateway.createPix({
    reference: `PEDIDO${order.number}`,
    amountCents: order.totalCents,
    payerEmail: order.user.email,
    expiresAt,
  });
  return prisma.payment.create({
    data: {
      orderId: order.id,
      provider: gateway.name,
      providerPaymentId: pix.providerPaymentId,
      method: "PIX",
      amountCents: order.totalCents,
      pixQrCode: pix.qrCode,
      pixExpiresAt: expiresAt,
    },
    select: { id: true },
  });
}

export type UpdateResult = "applied" | "duplicate" | "unknown-payment" | "ignored";

// Aplica uma atualização do gateway (vinda do webhook). O mesmo aviso (provider + eventId) só é
// processado uma vez, e um pagamento já finalizado não volta a pendente.
export async function applyGatewayUpdate(update: GatewayUpdate): Promise<UpdateResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: {
          provider_providerPaymentId: {
            provider: update.provider,
            providerPaymentId: update.providerPaymentId,
          },
        },
        select: {
          id: true,
          status: true,
          order: { select: { id: true, status: true, number: true } },
        },
      });
      const event = await tx.paymentEvent.create({
        data: {
          provider: update.provider,
          eventId: update.eventId,
          type: update.type,
          paymentId: payment?.id ?? null,
          payload: update.payload as Prisma.InputJsonValue,
        },
        select: { id: true },
      });
      const done = (result: UpdateResult) =>
        tx.paymentEvent
          .update({ where: { id: event.id }, data: { processedAt: new Date() } })
          .then(() => result);

      if (!payment) return done("unknown-payment");
      if (payment.status !== "PENDING" || update.status === "PENDING") return done("ignored");

      const now = new Date();
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: update.status,
          statusDetail: update.statusDetail ?? null,
          paidAt: update.status === "APPROVED" ? now : null,
        },
      });
      if (update.status === "APPROVED") {
        if (payment.order.status === "PENDING_PAYMENT") {
          await tx.order.update({
            where: { id: payment.order.id },
            data: { status: "PAID", paidAt: now },
          });
        } else {
          // Pago depois de cancelado (ex.: Pix pago após o prazo): precisa de reembolso manual.
          console.warn(
            `Pagamento aprovado para o pedido #${payment.order.number}, que está ${payment.order.status}. Verificar reembolso.`,
          );
        }
      }
      return done("applied");
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return "duplicate";
    }
    throw error;
  }
}

// Só no gateway simulado: faz o papel do banco confirmando o Pix.
export async function simulatePixApproval(userId: string, orderNumber: number) {
  if (!simulatedPaymentsAllowed()) throw new PaymentError("Simulação desativada.");
  const order = await payableOrder(userId, orderNumber);
  const payment = await prisma.payment.findFirst({
    where: {
      orderId: order.id,
      method: "PIX",
      status: "PENDING",
      provider: SIMULATED_PROVIDER,
      pixExpiresAt: { gt: new Date() },
    },
    select: { providerPaymentId: true },
  });
  if (!payment?.providerPaymentId)
    throw new PaymentError("Gere o Pix antes de simular o pagamento.");

  const update: GatewayUpdate = {
    provider: SIMULATED_PROVIDER,
    eventId: randomUUID(),
    type: "payment.updated",
    providerPaymentId: payment.providerPaymentId,
    status: "APPROVED",
    statusDetail: "accredited",
    payload: { simulated: true, method: "pix" },
  };
  return applyGatewayUpdate(update);
}
