"use server";

import { getCurrentUser } from "@/lib/dal";
import { createFeedback } from "@/lib/feedback";
import { clientIp, hit, tooManyMessage } from "@/lib/rate-limit";
import { feedbackSchema, fieldErrors, type FormState } from "@/lib/validation/feedback";

// Envio de feedback do beta (KAN-52). Funciona com ou sem login.
export async function sendFeedback(_state: FormState, formData: FormData): Promise<FormState> {
  const values = {
    kind: String(formData.get("kind") ?? ""),
    message: String(formData.get("message") ?? ""),
    path: String(formData.get("path") ?? ""),
    email: String(formData.get("email") ?? ""),
  };
  // Campo escondido: só robôs preenchem.
  if (formData.get("website")) return { success: true };

  const parsed = feedbackSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const limit = await hit(`feedback:ip:${await clientIp()}`, { limit: 10, windowSeconds: 3600 });
  if (!limit.allowed) return { message: tooManyMessage(limit.retryAfterSeconds), values };

  await createFeedback(parsed.data, await getCurrentUser());
  return { success: true };
}
