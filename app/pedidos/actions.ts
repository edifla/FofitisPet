"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/lib/dal";
import { sendOrderEmail } from "@/lib/order-emails";
import {
  PaymentError,
  payWithCard,
  simulatePixApproval,
  startPixPayment,
} from "@/lib/payments/service";
import { prisma } from "@/lib/prisma";
import { cardBrand, cardSchema, fieldErrors } from "@/lib/validation/card";
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

// Pagamento no cartão (KAN-109). O número e o CVV nunca voltam para o formulário nem são gravados.
export async function payWithCardAction(
  orderNumber: number,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser(`/pedidos/${orderNumber}`);
  const read = (name: string) => String(formData.get(name) ?? "");
  const values = {
    holderName: read("holderName"),
    expiry: read("expiry"),
    installments: read("installments"),
  };
  const parsed = cardSchema.safeParse({
    ...values,
    cardNumber: read("cardNumber"),
    cvv: read("cvv"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const { cardNumber, holderName, expiry, cvv, installments } = parsed.data;
  let result;
  try {
    result = await payWithCard(user.id, orderNumber, {
      card: { number: cardNumber, holderName, expiry, cvv },
      installments,
      brand: cardBrand(cardNumber),
    });
  } catch (error) {
    if (error instanceof PaymentError) return { message: error.message, values };
    throw error;
  }
  refresh();
  if (!result.approved) return { message: result.message, values };
  return { success: true };
}

// Reenvia o comprovante de uma doação já entregue ao abrigo (KAN-35). Só para o próprio doador.
export async function resendDonationReceipt(orderNumber: number): Promise<FormState> {
  const user = await requireUser(`/pedidos/${orderNumber}`);
  const order = await prisma.order.findFirst({
    where: { number: orderNumber, userId: user.id, destination: "SHELTER", status: "DELIVERED" },
    select: { id: true },
  });
  if (!order) return { message: "Comprovante disponível só para doações já entregues." };
  await sendOrderEmail(order.id, "paid");
  return { success: true, message: `Comprovante enviado para ${user.email}.` };
}
