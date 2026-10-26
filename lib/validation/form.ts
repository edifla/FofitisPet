import type * as z from "zod";

// Estado devolvido pelas Server Actions dos formulários.
export type FormState =
  | {
      errors?: Record<string, string[] | undefined>;
      message?: string;
      success?: boolean;
      // Valores digitados, para o formulário não perder o que o usuário escreveu.
      values?: Record<string, string | string[]>;
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
