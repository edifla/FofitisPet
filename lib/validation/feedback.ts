import * as z from "zod";
import { emailSchema } from "./auth";

export { fieldErrors, type FormState } from "./form";

// Feedback do beta (KAN-52).

export const feedbackSchema = z.object({
  kind: z.enum(["PROBLEM", "SUGGESTION", "PRAISE", "OTHER"], { error: "Escolha o tipo." }),
  message: z
    .string()
    .trim()
    .min(10, { error: "Conte com pelo menos 10 caracteres o que aconteceu ou o que sugere." })
    .max(3000, { error: "Use no máximo 3000 caracteres." }),
  // Caminho da página de onde a pessoa veio; qualquer coisa fora do formato vira nulo.
  path: z
    .string()
    .max(300)
    .transform((value) => (/^\/[^\s]*$/.test(value) ? value.split(/[?#]/)[0] : null)),
  email: z.union([z.literal("").transform(() => null), emailSchema]),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

export const feedbackUpdateSchema = z.object({
  status: z.enum(["NEW", "PLANNED", "DONE", "DISCARDED"], { error: "Escolha a situação." }),
  priority: z.union([z.literal("").transform(() => null), z.enum(["HIGH", "MEDIUM", "LOW"])], {
    error: "Escolha a prioridade.",
  }),
  adminNote: z
    .string()
    .trim()
    .max(2000, { error: "Use no máximo 2000 caracteres." })
    .transform((value) => value || null),
});
