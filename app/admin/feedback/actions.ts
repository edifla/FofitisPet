"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { feedbackUpdateSchema, fieldErrors, type FormState } from "@/lib/validation/feedback";

// Triagem do feedback do beta (KAN-52): situação, prioridade e anotação.
export async function updateFeedback(
  feedbackId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = {
    status: String(formData.get("status") ?? ""),
    priority: String(formData.get("priority") ?? ""),
    adminNote: String(formData.get("adminNote") ?? ""),
  };
  const parsed = feedbackUpdateSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const updated = await prisma.feedback.updateMany({
    where: { id: feedbackId },
    data: parsed.data,
  });
  if (updated.count === 0) return { message: "Feedback não encontrado.", values };
  refresh();
  return { success: true, message: "Salvo." };
}
