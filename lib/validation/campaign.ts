import * as z from "zod";
import { parseKg } from "@/lib/money";
import { slugify } from "@/lib/slug";
import { slugInput, SPECIES } from "./catalog";

export { fieldErrors, type FormState } from "./form";

// Campanhas de ração (KAN-42).

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Informe a data." })
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), { error: "Data inválida." })
  .transform((value) => new Date(`${value}T00:00:00Z`));

export const campaignSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, { error: "Informe um título com pelo menos 3 caracteres." })
      .max(120, { error: "Use no máximo 120 caracteres." }),
    slug: slugInput,
    description: z
      .string()
      .trim()
      .min(10, { error: "Descreva a campanha com pelo menos 10 caracteres." })
      .max(2000, { error: "Use no máximo 2000 caracteres." }),
    goal: z
      .string()
      .trim()
      .transform((value, ctx) => {
        const grams = parseKg(value);
        if (grams === null || grams > 100_000_000) {
          ctx.addIssue({ code: "custom", message: "Informe a meta em kg, ex.: 50 ou 12,5." });
          return z.NEVER;
        }
        return grams;
      }),
    species: z.union([z.literal("").transform(() => null), z.enum(SPECIES)], {
      error: "Escolha a espécie.",
    }),
    startsAt: isoDate,
    endsAt: z.union([z.literal("").transform(() => null), isoDate]),
    active: z.boolean(),
  })
  .refine((data) => !data.endsAt || data.endsAt >= data.startsAt, {
    path: ["endsAt"],
    error: "O fim precisa ser no mesmo dia ou depois do início.",
    // Checa mesmo com erros em outros campos, se as duas datas forem válidas.
    when: ({ value }) => {
      const { startsAt, endsAt } = value as { startsAt?: unknown; endsAt?: unknown };
      return startsAt instanceof Date && (endsAt === null || endsAt instanceof Date);
    },
  })
  .transform(({ goal, ...data }) => ({
    ...data,
    goalGrams: goal,
    slug: data.slug || slugify(data.title),
  }));
