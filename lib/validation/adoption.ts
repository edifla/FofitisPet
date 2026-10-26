import * as z from "zod";
import { UFS } from "./address";
import { emailSchema } from "./auth";

export { fieldErrors, type FormState } from "./form";

// Formulário de interesse em adoção (KAN-39).

export const HOUSING_TYPES = ["HOUSE", "APARTMENT", "FARM", "OTHER"] as const;

const text = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, {
      error: min > 1 ? `Escreva pelo menos ${min} caracteres sobre ${label}.` : `Informe ${label}.`,
    })
    .max(max, { error: `Use no máximo ${max} caracteres.` });

// Perguntas de sim ou não, respondidas com botões de opção "sim"/"nao".
const yesNo = (message: string) =>
  z.enum(["sim", "nao"], { error: message }).transform((value) => value === "sim");

export const adoptionInterestSchema = z
  .object({
    applicantName: text("seu nome", 1, 100),
    applicantEmail: emailSchema,
    // Celular ou fixo com DDD; guarda só os números.
    applicantPhone: z
      .string()
      .trim()
      .transform((value) => value.replace(/\D/g, ""))
      .refine((value) => value.length === 10 || value.length === 11, {
        error: "Informe o telefone com DDD.",
      }),
    applicantCity: text("sua cidade", 1, 80),
    applicantState: z.enum(UFS, { error: "Escolha a UF." }),
    housingType: z.enum(HOUSING_TYPES, { error: "Escolha o tipo de moradia." }),
    ownsHome: yesNo("Diga se a moradia é própria."),
    hasYard: yesNo("Diga se há quintal ou área externa."),
    householdAgrees: yesNo("Diga se todos na casa concordam com a adoção."),
    hasOtherPets: yesNo("Diga se há outros animais na casa."),
    otherPetsDescription: z
      .string()
      .trim()
      .max(500, { error: "Use no máximo 500 caracteres." })
      .transform((value) => value || null),
    experience: text("sua experiência com animais", 20, 2000),
    reason: text("por que quer adotar", 20, 2000),
    consent: z.literal("on", {
      error: "É preciso autorizar o uso dos dados para o abrigo avaliar a adoção.",
    }),
  })
  .refine((data) => !data.hasOtherPets || data.otherPetsDescription, {
    path: ["otherPetsDescription"],
    error: "Conte quais animais vivem com você.",
    // Checa mesmo com erros em outros campos, para mostrar tudo de uma vez.
    when: ({ value }) => (value as { hasOtherPets?: unknown }).hasOtherPets === true,
  });

export type AdoptionInterest = z.infer<typeof adoptionInterestSchema>;

export function formatPhone(digits: string) {
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  const split = rest.length === 9 ? 5 : 4;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}
