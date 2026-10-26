"use server";

import { refresh } from "next/cache";
import * as z from "zod";
import { AdoptionFlowError, changeRequestStatus } from "@/lib/adoption-requests";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { fieldErrors, type FormState } from "@/lib/validation/form";

const statusChangeSchema = z.object({
  status: z.enum(["RECEIVED", "IN_REVIEW", "INTERVIEW", "APPROVED", "REJECTED", "WITHDRAWN"], {
    error: "Escolha o novo status.",
  }),
  note: z
    .string()
    .trim()
    .max(1000, { error: "Use no máximo 1000 caracteres." })
    .transform((value) => value || null),
  // "AAAA-MM-DDTHH:MM" do campo datetime-local, no horário de Brasília.
  interviewAt: z
    .union([
      z.literal("").transform(() => null),
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, { error: "Data e hora inválidas." })
        .transform((value) => new Date(`${value}:00-03:00`)),
    ])
    .optional()
    .transform((value) => value ?? null),
});

// Muda o status de uma solicitação (KAN-116).
export async function updateRequestStatus(
  requestId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin();
  const values = {
    status: String(formData.get("status") ?? ""),
    note: String(formData.get("note") ?? ""),
    interviewAt: String(formData.get("interviewAt") ?? ""),
  };
  const parsed = statusChangeSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const { status, note, interviewAt } = parsed.data;

  try {
    await changeRequestStatus(requestId, { to: status, note, interviewAt, adminId: admin.id });
  } catch (error) {
    if (error instanceof AdoptionFlowError) return { message: error.message, values };
    throw error;
  }
  refresh();
  return { success: true, message: "Status atualizado." };
}

const notesSchema = z.object({
  adminNotes: z
    .string()
    .trim()
    .max(5000, { error: "Use no máximo 5000 caracteres." })
    .transform((value) => value || null),
});

// Anotações internas da equipe, nunca mostradas ao interessado.
export async function saveAdminNotes(
  requestId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = { adminNotes: String(formData.get("adminNotes") ?? "") };
  const parsed = notesSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const updated = await prisma.adoptionRequest.updateMany({
    where: { id: requestId },
    data: { adminNotes: parsed.data.adminNotes },
  });
  if (updated.count === 0) return { message: "Solicitação não encontrada.", values };
  refresh();
  return { success: true, message: "Anotações salvas." };
}
