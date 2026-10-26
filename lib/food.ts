import type { Prisma, Species } from "@/app/generated/prisma/client";

// O que conta como ração nos selos (KAN-45) e nas campanhas (KAN-42): variações com peso
// cadastrado de produtos da categoria Alimentação ou das subcategorias dela.

const FOOD_CATEGORY_SLUG = "alimentacao";

export function foodVariantWhere(species?: Species | null): Prisma.ProductVariantWhereInput {
  return {
    weightGrams: { not: null },
    product: {
      category: {
        OR: [{ slug: FOOD_CATEGORY_SLUG }, { parent: { slug: FOOD_CATEGORY_SLUG } }],
      },
      ...(species && { species: { has: species } }),
    },
  };
}

// Totais arredondados: "850 g", "3,5 kg", "12 kg". Para o peso exato de uma variação, use
// formatWeight de lib/money.
export function formatFoodTotal(grams: number) {
  if (grams < 1000) return `${grams} g`;
  const kg = grams / 1000;
  return `${kg.toLocaleString("pt-BR", { maximumFractionDigits: kg < 10 ? 1 : 0 })} kg`;
}
