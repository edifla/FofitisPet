"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/lib/dal";
import { PaymentError, simulatePixApproval, startPixPayment } from "@/lib/payments/service";
import type { FormState } from "@/lib/validation/form";

export async function payWithPix(orderNumber: number): Promise<FormState> {
  const user = await requireUser(`/pedidos/${orderNumber}`);
  try {
    await startPixPayment(user.id, orderNumber);
  } catch (error) {
    if (error instanceof PaymentError) return { message: error.message };
    throw error;
  }
  refresh();
  return { success: true };
}

// Só em desenvolvimento (gateway simulado).
export async function simulatePixPaid(orderNumber: number): Promise<FormState> {
  const user = await requireUser(`/pedidos/${orderNumber}`);
  try {
    await simulatePixApproval(user.id, orderNumber);
  } catch (error) {
    if (error instanceof PaymentError) return { message: error.message };
    throw error;
  }
  refresh();
  return { success: true };
}
