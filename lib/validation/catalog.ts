import * as z from "zod";
import { parseBRL, parseKg } from "@/lib/money";
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

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Use no máximo ${max} caracteres.` })
    .transform((value) => value || null);

export const variantSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { error: "Informe o nome da variação, ex.: 15 kg." })
      .max(60, { error: "Use no máximo 60 caracteres." }),
    sku: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9][A-Z0-9-]{2,39}$/, {
        error: "Use de 3 a 40 letras, números ou hífens, ex.: RAC-PREM-15KG.",
      }),
    // Convertidos campo a campo, para os erros de preço e peso aparecerem junto com os outros.
    priceCents: z
      .string()
      .trim()
      .transform((value, ctx) => {
        const cents = parseBRL(value);
        if (cents === null || cents <= 0 || cents > 100_000_000) {
          ctx.addIssue({ code: "custom", message: "Informe um preço válido, ex.: 199,90." });
          return z.NEVER;
        }
        return cents;
      }),
    weightGrams: z
      .string()
      .trim()
      .transform((value, ctx) => {
        if (!value) return null;
        const grams = parseKg(value);
        if (grams === null) {
          ctx.addIssue({ code: "custom", message: "Informe o peso em kg, ex.: 15 ou 0,5." });
          return z.NEVER;
        }
        return grams;
      }),
    size: optionalText(40),
    flavor: optionalText(40),
    active: z.boolean(),
  })
  .transform(({ size, flavor, ...data }) => {
    const attributes: Record<string, string> = {};
    if (size) attributes.tamanho = size;
    if (flavor) attributes.sabor = flavor;
    return { ...data, attributes: Object.keys(attributes).length ? attributes : undefined };
  });

const quantitySchema = (max: number) =>
  z.coerce
    .number({ error: "Informe um número inteiro." })
    .int({ error: "Informe um número inteiro." })
    .min(0, { error: "A quantidade não pode ser negativa." })
    .max(max, { error: `Use no máximo ${max}.` });

export const restockSchema = z.object({
  quantity: quantitySchema(100_000).refine((value) => value > 0, {
    error: "Informe quantas unidades chegaram.",
  }),
  note: z
    .string()
    .trim()
    .max(200)
    .transform((value) => value || null),
});

export const adjustmentSchema = z.object({
  counted: quantitySchema(100_000),
  note: z
    .string()
    .trim()
    .min(3, { error: "Explique o motivo do ajuste, ex.: inventário, avaria." })
    .max(200),
});

// Meta de saldo no abrigo (KAN-33). Vazio remove a meta.
export const shelterTargetSchema = z.object({
  target: z.union([z.literal("").transform(() => null), quantitySchema(10_000)]),
});
