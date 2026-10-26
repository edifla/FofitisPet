"use server";

import { refresh } from "next/cache";
import * as z from "zod";
import { addItem, CartError, MAX_QUANTITY_PER_ITEM, removeItem, setItemQuantity } from "@/lib/cart";
import type { FormState } from "@/lib/validation/form";

const addSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(MAX_QUANTITY_PER_ITEM),
});

export async function addToCart(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = addSchema.safeParse({
    variantId: formData.get("variantId"),
    quantity: formData.get("quantity") ?? 1,
  });
  if (!parsed.success) return { message: "Escolha uma opção e uma quantidade válida." };

  try {
    const { quantity, limited } = await addItem(parsed.data.variantId, parsed.data.quantity);
    refresh();
    return {
      success: true,
      message: limited
        ? `Adicionado até o limite disponível: você tem ${quantity} no carrinho.`
        : "Adicionado ao carrinho.",
    };
  } catch (error) {
    if (error instanceof CartError) return { message: error.message };
    throw error;
  }
}

export async function removeFromCart(itemId: string) {
  await removeItem(itemId);
  refresh();
}

const quantitySchema = z.coerce.number().int().min(0).max(MAX_QUANTITY_PER_ITEM);

export async function updateCartQuantity(
  itemId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  // Botões − e + mandam um passo sobre a quantidade atual; o campo manda o valor digitado.
  const step = formData.get("step");
  const parsed = quantitySchema.safeParse(
    step ? Number(formData.get("current")) + Number(step) : formData.get("quantity"),
  );
  if (!parsed.success) return { message: `Use uma quantidade entre 0 e ${MAX_QUANTITY_PER_ITEM}.` };

  try {
    const { quantity, limited } = await setItemQuantity(itemId, parsed.data);
    refresh();
    if (limited) {
      return { success: true, message: `Só há ${quantity} unidade(s) disponível(is).` };
    }
    return { success: true };
  } catch (error) {
    if (error instanceof CartError) return { message: error.message };
    throw error;
  }
}
