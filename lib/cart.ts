import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

// Carrinho no banco, identificado pelo cookie (KAN-24). Funciona sem login.

const CART_COOKIE = "fofitis_carrinho";
const CART_MAX_AGE = 60 * 24 * 60 * 60; // 60 dias
export const MAX_QUANTITY_PER_ITEM = 99;

export class CartError extends Error {}

async function readCartId(): Promise<string | null> {
  const value = (await cookies()).get(CART_COOKIE)?.value;
  return value && /^[0-9a-f-]{36}$/.test(value) ? value : null;
}

// Só em Server Actions: cria o carrinho e grava o cookie se ainda não houver.
async function ensureCartId(): Promise<string> {
  const current = await readCartId();
  if (current && (await prisma.cart.findUnique({ where: { id: current }, select: { id: true } }))) {
    return current;
  }
  const cart = await prisma.cart.create({ data: {}, select: { id: true } });
  (await cookies()).set(CART_COOKIE, cart.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_MAX_AGE,
  });
  return cart.id;
}

// Variação à venda e quanto há na loja. Lança CartError se não puder ser comprada.
async function sellableVariant(variantId: string) {
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, active: true, product: { active: true } },
    select: {
      id: true,
      stockLevels: { where: { location: "STORE" }, select: { quantity: true } },
    },
  });
  if (!variant) throw new CartError("Este produto não está mais disponível.");
  return { stock: variant.stockLevels[0]?.quantity ?? 0 };
}

// Soma a quantidade ao que já está no carrinho, sem passar do estoque da loja.
export async function addItem(variantId: string, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1) throw new CartError("Quantidade inválida.");
  const { stock } = await sellableVariant(variantId);
  if (stock <= 0) throw new CartError("Este produto está esgotado.");

  const cartId = await ensureCartId();
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId, variantId } },
    select: { quantity: true },
  });
  const limit = Math.min(stock, MAX_QUANTITY_PER_ITEM);
  const wanted = (existing?.quantity ?? 0) + quantity;
  const final = Math.min(wanted, limit);
  if (existing && existing.quantity >= limit) {
    throw new CartError(`Você já tem ${existing.quantity} no carrinho, o máximo disponível.`);
  }

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId, variantId } },
    create: { cartId, variantId, quantity: final },
    update: { quantity: final },
  });
  await prisma.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } });
  return { quantity: final, limited: final < wanted };
}

// Leitura do carrinho para as páginas. Lê cookies: precisa estar dentro de um <Suspense>.
export const getCart = cache(async () => {
  const cartId = await readCartId();
  if (!cartId) return { items: [], count: 0, subtotalCents: 0 };

  const items = await prisma.cartItem.findMany({
    where: { cartId },
    orderBy: { createdAt: "asc" },
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

  const lines = items.map(({ id, quantity, variant }) => {
    const stock = variant.stockLevels[0]?.quantity ?? 0;
    const available = variant.active && variant.product.active && stock > 0;
    return {
      id,
      quantity,
      variantId: variant.id,
      variantName: variant.name,
      productName: variant.product.name,
      productSlug: variant.product.slug,
      image: variant.product.images[0] ?? null,
      unitPriceCents: variant.priceCents,
      totalCents: variant.priceCents * quantity,
      stock,
      available,
      // Mais unidades no carrinho do que há na loja (o estoque caiu depois de adicionar).
      overStock: available && quantity > stock,
    };
  });
  const sellable = lines.filter((line) => line.available);
  return {
    items: lines,
    count: sellable.reduce((sum, line) => sum + line.quantity, 0),
    subtotalCents: sellable.reduce((sum, line) => sum + line.totalCents, 0),
  };
});

export type CartLine = Awaited<ReturnType<typeof getCart>>["items"][number];

// Remove um item do carrinho atual. Itens de outro carrinho são ignorados.
export async function removeItem(itemId: string) {
  const cartId = await readCartId();
  if (!cartId) return;
  await prisma.cartItem.deleteMany({ where: { id: itemId, cartId } });
}
