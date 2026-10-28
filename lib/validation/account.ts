import * as z from "zod";
import { emailSchema, passwordSchema } from "./auth";

export { fieldErrors, type FormState } from "./form";

// Área "Minha conta": dados pessoais, e-mail e senha.

// Celular ou fixo com DDD, guardado só com os números: (11) 98765-4321 → 11987654321.
const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((value) => value === "" || /^[1-9]{2}9?\d{8}$/.test(value), {
    error: "Informe o telefone com DDD, ex.: (11) 98765-4321.",
  })
  .transform((value) => value || null);

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Informe seu nome." })
    .max(100, { error: "Use no máximo 100 caracteres." }),
  phone: phoneSchema,
});

const currentPassword = z
  .string()
  .min(1, { error: "Informe a sua senha atual." })
  .max(128, { error: "Senha incorreta." });

export const emailChangeSchema = z.object({
  email: emailSchema,
  currentPassword,
});

export const passwordChangeSchema = z
  .object({
    currentPassword,
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    error: "As senhas não conferem.",
    path: ["passwordConfirmation"],
  })
  .refine((data) => data.password !== data.currentPassword, {
    error: "Escolha uma senha diferente da atual.",
    path: ["password"],
  });

// (11) 98765-4321 ou (11) 3456-7890, para mostrar o telefone guardado.
export function formatPhone(phone: string) {
  const ddd = phone.slice(0, 2);
  const rest = phone.slice(2);
  const split = rest.length === 9 ? 5 : 4;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}
