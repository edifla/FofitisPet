"use server";

import { refresh } from "next/cache";
import { CartError } from "@/lib/cart";
import { addKitToCart } from "@/lib/kits";
import { idArg } from "@/lib/validation/args";
import type { FormState } from "@/lib/validation/form";

// "Doar este kit" (KAN-43): todos os itens entram no carrinho como doação ao abrigo.
export async function donateKit(kitId: string): Promise<FormState> {
  try {
    const kit = await addKitToCart(idArg(kitId));
    refresh();
    return { success: true, message: `${kit.name} adicionado à doação. Obrigado!` };
  } catch (error) {
    if (error instanceof CartError) return { message: error.message };
    throw error;
  }
}
