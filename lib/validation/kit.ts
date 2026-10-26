import * as z from "zod";
import { slugify } from "@/lib/slug";
import { nameSchema, slugInput } from "./catalog";

export { fieldErrors, type FormState } from "./form";

// Kits de doação (KAN-43).

export const kitSchema = z
  .object({
    name: nameSchema,
    slug: slugInput,
    description: z
      .string()
      .trim()
      .min(10, { error: "Descreva o kit com pelo menos 10 caracteres." })
      .max(1000, { error: "Use no máximo 1000 caracteres." }),
    position: z.coerce
      .number({ error: "Informe um número." })
      .int({ error: "Informe um número inteiro." })
      .min(0)
      .max(9999),
    active: z.boolean(),
  })
  .transform((data) => ({ ...data, slug: data.slug || slugify(data.name) }));

export const kitItemSchema = z.object({
  variantId: z.string().min(1, { error: "Escolha o produto." }),
  quantity: z.coerce
    .number({ error: "Informe a quantidade." })
    .int({ error: "Informe um número inteiro." })
    .min(1, { error: "A quantidade mínima é 1." })
    .max(50, { error: "Use no máximo 50 unidades." }),
});
