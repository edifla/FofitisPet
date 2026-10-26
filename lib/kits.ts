import "server-only";
import type { Prisma } from "@/app/generated/prisma/client";
import { addItem, CartError } from "@/lib/cart";
import { prisma } from "@/lib/prisma";

// Kits de doação (KAN-43): conjuntos prontos que entram no carrinho como doação ao abrigo.

const kitSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  active: true,
  position: true,
  items: {
    orderBy: { id: "asc" },
    select: {
      id: true,
      quantity: true,
      variant: {
        select: {
          id: true,
          name: true,
          priceCents: true,
          active: true,
          stockLevels: { where: { location: "STORE" }, select: { quantity: true } },
          product: {
            select: {
              name: true,
              slug: true,
              active: true,
              donationEligible: true,
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
  },
} satisfies Prisma.DonationKitSelect;

type RawKit = Awaited<ReturnType<typeof findKits>>[number];

function findKits(where: { active?: boolean; id?: string }) {
  return prisma.donationKit.findMany({
    where,
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: kitSelect,
  });
}

// Preço atual e se dá para doar agora: todos os itens à venda, doáveis e com estoque na loja.
function withSummary(kit: RawKit) {
  const totalCents = kit.items.reduce((sum, i) => sum + i.quantity * i.variant.priceCents, 0);
  const problems = kit.items
    .filter(({ quantity, variant }) => {
      const stock = variant.stockLevels[0]?.quantity ?? 0;
      return (
        !variant.active ||
        !variant.product.active ||
        !variant.product.donationEligible ||
        stock < quantity
      );
    })
    .map((i) => `${i.variant.product.name} (${i.variant.name})`);
  const image = kit.items.find((i) => i.variant.product.images[0])?.variant.product.images[0];
  return {
    ...kit,
    totalCents,
    image: image ?? null,
    available: kit.items.length > 0 && problems.length === 0,
    problems,
  };
}

export type KitSummary = ReturnType<typeof withSummary>;

// Kits sem itens ainda estão sendo montados no admin e não aparecem.
export async function getActiveKits() {
  return (await findKits({ active: true })).filter((kit) => kit.items.length > 0).map(withSummary);
}

export async function getKitForAdmin(kitId: string) {
  const [kit] = await findKits({ id: kitId });
  return kit ? withSummary(kit) : null;
}

export async function listKitsForAdmin() {
  return (await findKits({})).map(withSummary);
}

// Põe todos os itens do kit no carrinho como doação. Confere tudo antes, para não deixar o
// kit pela metade no carrinho.
export async function addKitToCart(kitId: string) {
  const [raw] = await findKits({ id: kitId, active: true });
  if (!raw) throw new CartError("Este kit não está mais disponível.");
  const kit = withSummary(raw);
  if (!kit.available) {
    throw new CartError("Algum item deste kit está esgotado no momento. Tente outro kit.");
  }
  for (const item of kit.items) {
    await addItem(item.variant.id, item.quantity, true);
  }
  return kit;
}
