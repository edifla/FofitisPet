import * as z from "zod";

export { fieldErrors, type FormState } from "./form";

// Registro do que foi dado aos animais (KAN-34).
export const consumptionSchema = z.object({
  variantId: z.string().min(1, { error: "Escolha o item." }),
  quantity: z.coerce
    .number({ error: "Informe um número inteiro." })
    .int({ error: "Informe um número inteiro." })
    .min(1, { error: "Informe pelo menos 1 unidade." })
    .max(10_000, { error: "Use no máximo 10000." }),
  animalId: z
    .string()
    .trim()
    .transform((value) => value || null),
  consumedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Informe a data." })
    .refine((value) => !Number.isNaN(Date.parse(`${value}T12:00:00Z`)), {
      error: "Data inválida.",
    })
    .refine((value) => new Date(`${value}T12:00:00-03:00`) <= new Date(), {
      error: "A data não pode estar no futuro.",
    }),
  note: z
    .string()
    .trim()
    .max(200, { error: "Use no máximo 200 caracteres." })
    .transform((value) => value || null),
});
