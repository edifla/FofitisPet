"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { addressSchema, fieldErrors, type FormState } from "@/lib/validation/address";

const FIELDS = [
  "recipientName",
  "zipCode",
  "street",
  "number",
  "complement",
  "neighborhood",
  "city",
  "state",
  "label",
] as const;

// Salva um endereço novo e segue para o resumo do pedido com ele.
export async function createAddress(_state: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/checkout");
  const values = Object.fromEntries(FIELDS.map((f) => [f, String(formData.get(f) ?? "")]));
  const parsed = addressSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const count = await prisma.address.count({ where: { userId: user.id } });
  if (count >= 10) {
    return { message: "Você já tem 10 endereços salvos. Use um deles.", values };
  }
  const makeDefault = count === 0 || formData.get("isDefault") === "on";

  const address = await prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }
    return tx.address.create({
      data: { ...parsed.data, userId: user.id, isDefault: makeDefault },
      select: { id: true },
    });
  });

  redirect(`/checkout/resumo?endereco=${address.id}`);
}
