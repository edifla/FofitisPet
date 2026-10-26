import * as z from "zod";

export { fieldErrors, type FormState } from "./form";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Informe um e-mail válido." }));

export const passwordSchema = z
  .string()
  .min(8, { error: "Use pelo menos 8 caracteres." })
  .max(128, { error: "Use no máximo 128 caracteres." })
  .regex(/[a-zA-Z]/, { error: "Inclua pelo menos uma letra." })
  .regex(/[0-9]/, { error: "Inclua pelo menos um número." });

export const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { error: "Informe seu nome." })
      .max(100, { error: "Use no máximo 100 caracteres." }),
    email: emailSchema,
    password: passwordSchema,
    passwordConfirmation: z.string(),
    // Aceite dos termos e da política de privacidade (KAN-124).
    acceptTerms: z.literal("on", {
      error: "Para criar a conta, aceite os termos de uso e a política de privacidade.",
    }),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    error: "As senhas não conferem.",
    path: ["passwordConfirmation"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "Informe sua senha." }).max(128),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    error: "As senhas não conferem.",
    path: ["passwordConfirmation"],
  });
