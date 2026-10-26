import "server-only";
import { randomUUID } from "node:crypto";
import { Prisma } from "@/app/generated/prisma/client";
import { sendOrderEmail } from "@/lib/order-emails";
import { expireOrderIfStale } from "@/lib/orders";
import { prisma } from "@/lib/prisma";
import {
  GatewayInputError,
  getGateway,
  simulatedPaymentsAllowed,
  type GatewayUpdate,
} from "./index";
import { SIMULATED_PROVIDER } from "./simulated";
import type { CardData } from "./types";

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
  if (order.status === "PENDING_PAYMENT" && (await expireOrderIfStale({ id: order.id }))) {
    throw new PaymentError("O prazo de pagamento deste pedido expirou e ele foi cancelado.");
  }
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

const cardMessages: Record<string, string> = {
  cc_rejected_insufficient_amount: "Pagamento recusado: saldo ou limite insuficiente.",
  cc_rejected_bad_filled_security_code: "Pagamento recusado: confira o código de segurança.",
};

// Paga o pedido no cartão (KAN-109). O gateway responde na hora; a resposta passa pelo mesmo
// caminho dos webhooks, então um aviso posterior do mesmo pagamento é tratado igual.
export async function payWithCard(
  userId: string,
  orderNumber: number,
  input: { card: CardData; installments: number; brand: string },
): Promise<{ approved: true } | { approved: false; message: string }> {
  const order = await payableOrder(userId, orderNumber);
  const gateway = getGateway();

  let charge;
  try {
    charge = await gateway.createCardPayment({
      reference: `PEDIDO${order.number}`,
      amountCents: order.totalCents,
      payerEmail: order.user.email,
      installments: input.installments,
      card: input.card,
    });
  } catch (error) {
    if (error instanceof GatewayInputError) throw new PaymentError(error.message);
    throw error;
  }

  await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: gateway.name,
      providerPaymentId: charge.providerPaymentId,
      method: "CREDIT_CARD",
      amountCents: order.totalCents,
      cardBrand: input.brand,
      cardLastFour: input.card.number.slice(-4),
      installments: input.installments,
    },
  });
  await applyGatewayUpdate({
    provider: gateway.name,
    eventId: `sync:${charge.providerPaymentId}`,
    type: "payment.created",
    providerPaymentId: charge.providerPaymentId,
    status: charge.status,
    statusDetail: charge.statusDetail,
    // Sem dados do cartão no registro do evento.
    payload: { status: charge.status, statusDetail: charge.statusDetail },
  });

  if (charge.status === "APPROVED") return { approved: true };
  if (charge.status === "PENDING") {
    return { approved: false, message: "Pagamento em análise. Avisaremos quando for aprovado." };
  }
  return {
    approved: false,
    message:
      cardMessages[charge.statusDetail] ??
      "Pagamento recusado pelo emissor do cartão. Tente outro cartão ou pague com Pix.",
  };
}

export type UpdateResult = "applied" | "duplicate" | "unknown-payment" | "ignored";

// Aplica uma atualização do gateway (vinda do webhook). O mesmo aviso (provider + eventId) só é
// processado uma vez, e um pagamento já finalizado não volta a pendente.
export async function applyGatewayUpdate(update: GatewayUpdate): Promise<UpdateResult> {
  // Pedido que passou a pago nesta atualização, para o e-mail sair depois do commit.
  let paidOrderId: string | null = null;
  let result: UpdateResult;
  try {
    result = await prisma.$transaction(async (tx) => {
      paidOrderId = null;
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
      // Só pagamentos pendentes mudam. Exceção: um pagamento que nós cancelamos (pedido expirado)
      // e que o gateway aprovou mesmo assim é registrado, para ser estornado.
      const canChange =
        payment.status === "PENDING" ||
        (payment.status === "CANCELED" && update.status === "APPROVED");
      if (!canChange || update.status === "PENDING") return done("ignored");

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
        // Condicional: se o pedido expirou no mesmo instante, não volta para pago.
        const paid = await tx.order.updateMany({
          where: { id: payment.order.id, status: "PENDING_PAYMENT" },
          data: { status: "PAID", paidAt: now },
        });
        if (paid.count === 1) paidOrderId = payment.order.id;
        if (paid.count === 0) {
          // Pago depois de cancelado (ex.: Pix pago após o prazo): precisa de reembolso manual.
          await tx.payment.update({
            where: { id: payment.id },
            data: { statusDetail: "approved_after_order_closed" },
          });
          console.warn(
            `Pagamento aprovado para o pedido #${payment.order.number}, que não aguardava mais pagamento. Verificar reembolso.`,
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
  if (paidOrderId) await sendOrderEmail(paidOrderId, "paid");
  return result;
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
