"use server";

import { prisma } from "@/lib/prisma";
import { clientIp, hit, LIMITS, tooManyMessage } from "@/lib/rate-limit";
import {
  fieldErrors,
  helpInterestSchema,
  type FormState,
  type HelpKind,
} from "@/lib/validation/help";

// Aba Doar: a pessoa deixa o contato para ser avisada quando a doação em dinheiro abrir (KAN-46) ou
// para ser voluntária. Não precisa de conta; o abrigo vê os contatos no admin (/admin/interessados).
// Uma ação para cada formulário, sem .bind: dois formulários da mesma página com a mesma ação
// ligada a valores diferentes travam o servidor no envio sem JavaScript (useActionState).
export async function registerMoneyInterest(state: FormState, formData: FormData) {
  return register("MONEY", state, formData);
}

export async function registerVolunteerInterest(state: FormState, formData: FormData) {
  return register("VOLUNTEER", state, formData);
}

async function register(kind: HelpKind, _state: FormState, formData: FormData): Promise<FormState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    message: String(formData.get("message") ?? ""),
  };
  const parsed = helpInterestSchema.safeParse({ ...values, consent: formData.get("consent") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const limit = await hit(`help:ip:${await clientIp()}`, LIMITS.helpByIp);
  if (!limit.allowed) return { message: tooManyMessage(limit.retryAfterSeconds), values };

  const { consent: _consent, ...data } = parsed.data;
  await prisma.helpInterest.create({ data: { ...data, kind } });
  return {
    success: true,
    message:
      kind === "MONEY"
        ? "Pronto! Avisamos você por e-mail assim que a doação em dinheiro abrir."
        : "Obrigado! A equipe do abrigo vai entrar em contato para combinar.",
  };
}
