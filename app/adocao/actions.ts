"use server";

import { createAdoptionRequest } from "@/lib/adoption-requests";
import { getCurrentUser } from "@/lib/dal";
import { adoptionInterestSchema, fieldErrors, type FormState } from "@/lib/validation/adoption";

const TEXT_FIELDS = [
  "applicantName",
  "applicantEmail",
  "applicantPhone",
  "applicantCity",
  "applicantState",
  "housingType",
  "ownsHome",
  "hasYard",
  "householdAgrees",
  "hasOtherPets",
  "otherPetsDescription",
  "experience",
  "reason",
] as const;

const failures = {
  unavailable: "Este animal não está mais disponível para adoção.",
  duplicate: "Você já enviou interesse por este animal. A equipe do abrigo vai entrar em contato.",
  too_many: "Você enviou muitos formulários hoje. Tente de novo amanhã.",
};

// Formulário "Quero adotar" (KAN-39). Funciona com ou sem login.
export async function submitAdoptionInterest(
  animalId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = Object.fromEntries(
    TEXT_FIELDS.map((field) => [field, String(formData.get(field) ?? "")]),
  );
  // Campo escondido: só robôs preenchem.
  if (formData.get("website")) return { success: true };

  const parsed = adoptionInterestSchema.safeParse({
    ...values,
    consent: formData.get("consent") ?? undefined,
  });
  if (!parsed.success) {
    return {
      errors: fieldErrors(parsed.error),
      message: "Confira os campos destacados.",
      values: { ...values, consent: formData.get("consent") ? "on" : "" },
    };
  }

  const user = await getCurrentUser();
  const result = await createAdoptionRequest(animalId, user?.id ?? null, parsed.data);
  if (!result.ok) return { message: failures[result.reason], values };
  return { success: true };
}
