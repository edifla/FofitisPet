import * as z from "zod";
import { emailSchema } from "./auth";

export { fieldErrors, type FormState } from "./form";

// Aba Doar: avisar quando a doação em dinheiro abrir e interesse em ser voluntário.

const phone = z
  .string()
  .trim()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((value) => value === "" || /^[1-9]{2}9?\d{8}$/.test(value), {
    error: "Informe o telefone com DDD, ex.: (11) 98765-4321.",
  })
  .transform((value) => value || null);

export const helpInterestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Informe seu nome." })
    .max(100, { error: "Use no máximo 100 caracteres." }),
  email: emailSchema,
  phone,
  message: z
    .string()
    .trim()
    .max(1000, { error: "Use no máximo 1000 caracteres." })
    .transform((value) => value || null),
  consent: z.literal("on", {
    error: "Para continuar, aceite que o abrigo use esses dados para falar com você.",
  }),
});

export const HELP_KINDS = ["MONEY", "VOLUNTEER"] as const;
export type HelpKind = (typeof HELP_KINDS)[number];
