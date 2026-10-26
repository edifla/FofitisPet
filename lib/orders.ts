import "server-only";
import type { Prisma } from "@/app/generated/prisma/client";
import { sendOrderEmail } from "@/lib/order-emails";
import { prisma } from "@/lib/prisma";
import { moveStock } from "@/lib/stock";

// Ciclo de vida dos pedidos não pagos (KAN-110).

// Tempo para pagar depois de criar o pedido. Enquanto houver um Pix válido gerado dentro desse
// prazo, o pedido espera o Pix vencer.
export const PAYMENT_WINDOW_MINUTES = 60;

export const EXPIRED_REASON = "Prazo de pagamento expirado";

export function paymentDeadline(createdAt: Date) {
  return new Date(createdAt.getTime() + PAYMENT_WINDOW_MINUTES * 60 * 1000);
}

// Cancela um pedido que ainda aguarda pagamento e devolve o estoque reservado. Devolve false se o
// pedido já mudou de situação (ex.: foi pago no mesmo instante).
export async function cancelUnpaidOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
  reason: string,
) {
  const now = new Date();
  // A condição no WHERE impede cancelar um pedido que acabou de ser pago.
  const updated = await tx.order.updateMany({
    where: { id: orderId, status: "PENDING_PAYMENT" },
    data: { status: "CANCELED", canceledAt: now, cancelReason: reason },
  });
  if (updated.count === 0) return false;

  const reserved = await tx.stockMovement.groupBy({
    by: ["variantId", "fromLocation"],
    // Reservas feitas ao criar o pedido: venda ou doação ao abrigo ainda não paga.
    where: { orderId, type: { in: ["SALE", "DONATION_TRANSFER"] }, fromLocation: { not: null } },
    _sum: { quantity: true },
  });
  for (const line of reserved) {
    if (!line.fromLocation || !line._sum.quantity) continue;
    await moveStock(tx, {
      variantId: line.variantId,
      type: "RETURN",
      from: null,
      to: line.fromLocation,
      quantity: line._sum.quantity,
      orderId,
      note: reason,
    });
  }
  await tx.payment.updateMany({
    where: { orderId, status: "PENDING" },
    data: { status: "CANCELED", statusDetail: "order_canceled" },
  });
  return true;
}

// Pedidos que passaram do prazo sem pagamento e sem Pix válido.
function staleWhere(now: Date): Prisma.OrderWhereInput {
  return {
    status: "PENDING_PAYMENT",
    createdAt: { lt: new Date(now.getTime() - PAYMENT_WINDOW_MINUTES * 60 * 1000) },
    payments: { none: { method: "PIX", status: "PENDING", pixExpiresAt: { gt: now } } },
  };
}

// Expira um pedido específico, se for o caso. Chamado ao abrir o pedido ou tentar pagá-lo, para o
// prazo valer mesmo sem a rotina periódica.
export async function expireOrderIfStale(order: { id: string } | { number: number }) {
  const stale = await prisma.order.findFirst({
    where: { ...order, ...staleWhere(new Date()) },
    select: { id: true },
  });
  if (!stale) return false;
  const canceled = await prisma.$transaction((tx) =>
    cancelUnpaidOrder(tx, stale.id, EXPIRED_REASON),
  );
  if (canceled) await sendOrderEmail(stale.id, "canceled");
  return canceled;
}

// Rotina periódica: expira todos os pedidos vencidos. Devolve quantos foram cancelados.
export async function expireStaleOrders(limit = 100) {
  const stale = await prisma.order.findMany({
    where: staleWhere(new Date()),
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true },
  });
  let canceled = 0;
  for (const order of stale) {
    const done = await prisma.$transaction((tx) => cancelUnpaidOrder(tx, order.id, EXPIRED_REASON));
    if (done) {
      canceled++;
      await sendOrderEmail(order.id, "canceled");
    }
  }
  return canceled;
}
