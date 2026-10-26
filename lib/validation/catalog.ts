import * as z from "zod";
import { slugify } from "@/lib/slug";

export { fieldErrors, type FormState } from "./form";

const SPECIES = ["DOG", "CAT", "BIRD", "FISH", "SMALL_PET", "OTHER"] as const;

const nameSchema = z
  .string()
  .trim()
  .min(2, { error: "Informe um nome com pelo menos 2 caracteres." })
  .max(120, { error: "Use no máximo 120 caracteres." });

// Slug opcional no formulário: se vier vazio, é gerado a partir do nome.
const slugInput = z
  .string()
  .trim()
  .max(80, { error: "Use no máximo 80 caracteres." })
  .refine((value) => value === "" || /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value), {
    error: "Use só letras minúsculas sem acento, números e hífens.",
  });

const optionalId = z
  .string()
  .trim()
  .transform((value) => value || null);

function withSlug<T extends { name: string; slug: string }>(data: T) {
  return { ...data, slug: data.slug || slugify(data.name) };
}

export const categorySchema = z
  .object({
    name: nameSchema,
    slug: slugInput,
    description: z
      .string()
      .trim()
      .max(500, { error: "Use no máximo 500 caracteres." })
      .transform((value) => value || null),
    parentId: optionalId,
    position: z.coerce.number({ error: "Informe um número." }).int().min(0).max(9999),
  })
  .transform(withSlug);

export const brandSchema = z.object({ name: nameSchema, slug: slugInput }).transform(withSlug);

export const productSchema = z
  .object({
    name: nameSchema,
    slug: slugInput,
    description: z
      .string()
      .trim()
      .min(10, { error: "Descreva o produto com pelo menos 10 caracteres." })
      .max(5000, { error: "Use no máximo 5000 caracteres." }),
    categoryId: z.string().trim().min(1, { error: "Escolha uma categoria." }),
    brandId: optionalId,
    species: z.array(z.enum(SPECIES)).min(1, { error: "Marque pelo menos uma espécie." }),
    donationEligible: z.boolean(),
    active: z.boolean(),
  })
  .transform(withSlug);
