import * as z from "zod";

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
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    error: "As senhas não conferem.",
    path: ["passwordConfirmation"],
  });

// Estado devolvido pelas Server Actions dos formulários de autenticação.
export type FormState =
  | {
      errors?: Record<string, string[] | undefined>;
      message?: string;
      // Valores digitados, para o formulário não perder o que o usuário escreveu.
      values?: Record<string, string>;
    }
  | undefined;

// Agrupa os erros do Zod por campo, no formato usado pelos formulários.
export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (errors[key] ??= []).push(issue.message);
  }
  return errors;
}

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "Informe sua senha." }).max(128),
});
