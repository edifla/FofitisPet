import "server-only";
import type { Prisma, StockLocation, StockMovementType } from "@/app/generated/prisma/client";

// Toda mudança de estoque passa por aqui: ajusta os saldos (StockLevel) e registra o movimento
// (StockMovement) na mesma transação. Usado pelo admin (KAN-97), pela compra para o abrigo
// (KAN-32) e pelo consumo do abrigo (KAN-34).

export class InsufficientStockError extends Error {
  constructor(
    readonly variantId: string,
    readonly location: StockLocation,
  ) {
    super(`Saldo insuficiente de ${variantId} em ${location}`);
  }
}

type Movement = {
  variantId: string;
  type: StockMovementType;
  // null = a unidade entra de fora (from) ou sai do sistema (to).
  from: StockLocation | null;
  to: StockLocation | null;
  quantity: number;
  note?: string | null;
  createdById?: string | null;
  orderId?: string | null;
};

export async function moveStock(tx: Prisma.TransactionClient, movement: Movement) {
  const { variantId, from, to, quantity } = movement;
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("A quantidade do movimento precisa ser um inteiro positivo.");
  }

  if (from) {
    // A condição no WHERE torna a baixa segura com pedidos simultâneos: se outra transação
    // já levou o saldo, nenhuma linha é atualizada.
    const taken = await tx.stockLevel.updateMany({
      where: { variantId, location: from, quantity: { gte: quantity } },
      data: { quantity: { decrement: quantity } },
    });
    if (taken.count === 0) throw new InsufficientStockError(variantId, from);
  }

  if (to) {
    await tx.stockLevel.upsert({
      where: { variantId_location: { variantId, location: to } },
      create: { variantId, location: to, quantity },
      update: { quantity: { increment: quantity } },
    });
  }

  return tx.stockMovement.create({
    data: {
      variantId,
      type: movement.type,
      fromLocation: from,
      toLocation: to,
      quantity,
      note: movement.note ?? null,
      createdById: movement.createdById ?? null,
      orderId: movement.orderId ?? null,
    },
  });
}
