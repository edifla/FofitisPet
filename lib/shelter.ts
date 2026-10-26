import "server-only";
import { prisma } from "@/lib/prisma";

// Abrigo da FofitisPet: o que está faltando (KAN-33).

export type ShelterNeed = {
  variantId: string;
  productName: string;
  productSlug: string;
  variantName: string;
  priceCents: number;
  image: { url: string; alt: string | null } | null;
  quantity: number;
  target: number;
  missing: number;
  // Dá para doar agora: há unidades na loja.
  available: boolean;
};

// Itens doáveis abaixo da meta do abrigo, do mais em falta (proporcionalmente) para o menos.
export async function getShelterNeeds(limit = 12): Promise<ShelterNeed[]> {
  const levels = await prisma.stockLevel.findMany({
    where: {
      location: "SHELTER",
      targetQuantity: { gt: 0 },
      variant: { active: true, product: { active: true, donationEligible: true } },
    },
    select: {
      quantity: true,
      targetQuantity: true,
      variant: {
        select: {
          id: true,
          name: true,
          priceCents: true,
          stockLevels: { where: { location: "STORE" }, select: { quantity: true } },
          product: {
            select: {
              name: true,
              slug: true,
              images: {
                orderBy: [{ position: "asc" }, { createdAt: "asc" }],
                take: 1,
                select: { url: true, alt: true },
              },
            },
          },
        },
      },
    },
  });

  return levels
    .filter((level) => level.quantity < (level.targetQuantity ?? 0))
    .map(({ quantity, targetQuantity, variant }) => {
      const target = targetQuantity ?? 0;
      return {
        variantId: variant.id,
        productName: variant.product.name,
        productSlug: variant.product.slug,
        variantName: variant.name,
        priceCents: variant.priceCents,
        image: variant.product.images[0] ?? null,
        quantity,
        target,
        missing: target - quantity,
        available: (variant.stockLevels[0]?.quantity ?? 0) > 0,
      };
    })
    .sort(
      (a, b) =>
        Number(b.available) - Number(a.available) ||
        a.quantity / a.target - b.quantity / b.target ||
        b.missing - a.missing,
    )
    .slice(0, limit);
}
