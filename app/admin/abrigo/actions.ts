"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { InsufficientStockError, moveStock } from "@/lib/stock";
import { consumptionSchema, fieldErrors, type FormState } from "@/lib/validation/shelter";

// Registra o que foi dado aos animais (KAN-34): baixa o estoque do abrigo e guarda o consumo,
// ligado ao movimento de estoque, na mesma transação.
export async function recordConsumption(_state: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const read = (name: string) => String(formData.get(name) ?? "");
  const values = {
    variantId: read("variantId"),
    quantity: read("quantity"),
    animalId: read("animalId"),
    consumedOn: read("consumedOn"),
    note: read("note"),
  };
  const parsed = consumptionSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const { variantId, quantity, animalId, consumedOn, note } = parsed.data;

  if (
    animalId &&
    !(await prisma.animal.findUnique({ where: { id: animalId }, select: { id: true } }))
  ) {
    return { errors: { animalId: ["Animal não encontrado."] }, values };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const movement = await moveStock(tx, {
        variantId,
        type: "SHELTER_CONSUMPTION",
        from: "SHELTER",
        to: null,
        quantity,
        note,
        createdById: admin.id,
      });
      await tx.shelterConsumption.create({
        data: {
          variantId,
          quantity,
          animalId,
          // Meio-dia no horário de Brasília, para a data não mudar com o fuso.
          consumedAt: new Date(`${consumedOn}T12:00:00-03:00`),
          note,
          recordedById: admin.id,
          stockMovementId: movement.id,
        },
      });
    });
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return {
        errors: { quantity: ["O abrigo não tem essa quantidade. Confira o saldo."] },
        values,
      };
    }
    throw error;
  }
  refresh();
  return { success: true, message: `Consumo de ${quantity} unidade(s) registrado.` };
}
