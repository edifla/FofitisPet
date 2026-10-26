import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

// Carrinho no banco, identificado pelo cookie (KAN-24). Funciona sem login.

const CART_COOKIE = "fofitis_carrinho";
const CART_MAX_AGE = 60 * 24 * 60 * 60; // 60 dias
export const MAX_QUANTITY_PER_ITEM = 99;

export class CartError extends Error {}

export async function readCartId(): Promise<string | null> {
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
  await setCartCookie(cart.id);
  return cart.id;
}

async function setCartCookie(cartId: string) {
  (await cookies()).set(CART_COOKIE, cartId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_MAX_AGE,
  });
}

// No logout: o carrinho continua salvo na conta, mas este navegador deixa de vê-lo.
export async function clearCartCookie() {
  (await cookies()).delete(CART_COOKIE);
}

// No login (KAN-104): o carrinho do visitante passa a ser da conta. Se a conta já tinha um
// carrinho, os itens se juntam (somando quantidades sem passar do estoque) e fica o da conta.
export async function attachCartToUser(userId: string) {
  const guestId = await readCartId();
  const [guest, saved] = await Promise.all([
    guestId
      ? prisma.cart.findUnique({
          where: { id: guestId },
          select: {
            id: true,
            userId: true,
            items: { select: { variantId: true, quantity: true, donation: true } },
          },
        })
      : null,
    prisma.cart.findUnique({
      where: { userId },
      select: { id: true, items: { select: { variantId: true, quantity: true, donation: true } } },
    }),
  ]);

  // Um carrinho de outra conta neste navegador não é herdado.
  const guestCart = guest && (guest.userId === null || guest.userId === userId) ? guest : null;

  if (!saved) {
    if (guestCart) {
      await prisma.cart.update({ where: { id: guestCart.id }, data: { userId } });
      await setCartCookie(guestCart.id);
    } else if (guest) {
      await clearCartCookie();
    }
    return;
  }
  if (guestCart && guestCart.id !== saved.id) {
    const stocks = await prisma.stockLevel.findMany({
      where: { location: "STORE", variantId: { in: guestCart.items.map((i) => i.variantId) } },
      select: { variantId: true, quantity: true },
    });
    const stockOf = new Map(stocks.map((s) => [s.variantId, s.quantity]));
    const key = (i: { variantId: string; donation: boolean }) => `${i.variantId}:${i.donation}`;
    const savedQty = new Map(saved.items.map((i) => [key(i), i.quantity]));
    await prisma.$transaction([
      ...guestCart.items.map((item) => {
        const limit = Math.min(stockOf.get(item.variantId) ?? 0, MAX_QUANTITY_PER_ITEM);
        const quantity = Math.max(
          1,
          Math.min((savedQty.get(key(item)) ?? 0) + item.quantity, limit),
        );
        const { variantId, donation } = item;
        return prisma.cartItem.upsert({
          where: { cartId_variantId_donation: { cartId: saved.id, variantId, donation } },
          create: { cartId: saved.id, variantId, donation, quantity },
          update: { quantity },
        });
      }),
      prisma.cart.delete({ where: { id: guestCart.id } }),
    ]);
  }
  await setCartCookie(saved.id);
}

// Variação à venda e quanto há na loja. Lança CartError se não puder ser comprada.
async function sellableVariant(variantId: string) {
  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, active: true, product: { active: true } },
    select: {
      id: true,
      product: { select: { donationEligible: true } },
      stockLevels: { where: { location: "STORE" }, select: { quantity: true } },
    },
  });
  if (!variant) throw new CartError("Este produto não está mais disponível.");
  return {
    stock: variant.stockLevels[0]?.quantity ?? 0,
    donationEligible: variant.product.donationEligible,
  };
}

// Soma a quantidade ao que já está no carrinho, sem passar do estoque da loja. Com donation, o
// item vai para o abrigo (KAN-30) e fica numa linha separada do mesmo produto para o cliente.
export async function addItem(variantId: string, quantity: number, donation = false) {
  if (!Number.isInteger(quantity) || quantity < 1) throw new CartError("Quantidade inválida.");
  const { stock, donationEligible } = await sellableVariant(variantId);
  if (donation && !donationEligible) {
    throw new CartError("Este produto não pode ser doado ao abrigo.");
  }
  if (stock <= 0) throw new CartError("Este produto está esgotado.");

  const cartId = await ensureCartId();
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId_donation: { cartId, variantId, donation } },
    select: { quantity: true },
  });
  const limit = Math.min(stock, MAX_QUANTITY_PER_ITEM);
  const wanted = (existing?.quantity ?? 0) + quantity;
  const final = Math.min(wanted, limit);
  if (existing && existing.quantity >= limit) {
    throw new CartError(`Você já tem ${existing.quantity} no carrinho, o máximo disponível.`);
  }

  await prisma.cartItem.upsert({
    where: { cartId_variantId_donation: { cartId, variantId, donation } },
    create: { cartId, variantId, donation, quantity: final },
    update: { quantity: final },
  });
  await prisma.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } });
  return { quantity: final, limited: final < wanted };
}

// Leitura do carrinho para as páginas. Lê cookies: precisa estar dentro de um <Suspense>.
export const getCart = cache(async () => {
  const cartId = await readCartId();
  if (!cartId) return summarize([]);

  const items = await prisma.cartItem.findMany({
    where: { cartId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      quantity: true,
      donation: true,
      variant: {
        select: {
          id: true,
          name: true,
          priceCents: true,
          weightGrams: true,
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
  });

  const lines: CartLine[] = items.map(({ id, quantity, donation, variant }) => {
    const stock = variant.stockLevels[0]?.quantity ?? 0;
    // Item de doação de um produto que deixou de ser doável também fica indisponível.
    const available =
      variant.active &&
      variant.product.active &&
      stock > 0 &&
      (!donation || variant.product.donationEligible);
    return {
      id,
      quantity,
      donation,
      donationEligible: variant.product.donationEligible,
      variantId: variant.id,
      variantName: variant.name,
      productName: variant.product.name,
      productSlug: variant.product.slug,
      image: variant.product.images[0] ?? null,
      unitPriceCents: variant.priceCents,
      weightGrams: variant.weightGrams,
      totalCents: variant.priceCents * quantity,
      stock,
      available,
      overStock: available && quantity > stock,
    };
  });
  return summarize(lines);
});

export type CartLine = {
  id: string;
  quantity: number;
  donation: boolean;
  donationEligible: boolean;
  variantId: string;
  variantName: string;
  productName: string;
  productSlug: string;
  image: { url: string; alt: string | null } | null;
  unitPriceCents: number;
  weightGrams: number | null;
  totalCents: number;
  stock: number;
  available: boolean;
  // Mais unidades no carrinho do que há na loja (o estoque caiu depois de adicionar).
  overStock: boolean;
};

// Totais separados: a compra (que paga frete) e a doação ao abrigo (KAN-30).
function summarize(items: CartLine[]) {
  const sum = (lines: CartLine[], pick: (line: CartLine) => number) =>
    lines.reduce((total, line) => total + pick(line), 0);
  const sellable = items.filter((line) => line.available);
  const purchase = sellable.filter((line) => !line.donation);
  const donation = sellable.filter((line) => line.donation);
  return {
    items,
    count: sum(sellable, (line) => line.quantity),
    purchaseCount: sum(purchase, (line) => line.quantity),
    donationCount: sum(donation, (line) => line.quantity),
    subtotalCents: sum(purchase, (line) => line.totalCents),
    donationSubtotalCents: sum(donation, (line) => line.totalCents),
  };
}

// Remove um item do carrinho atual. Itens de outro carrinho são ignorados.
export async function removeItem(itemId: string) {
  const cartId = await readCartId();
  if (!cartId) return;
  await prisma.cartItem.deleteMany({ where: { id: itemId, cartId } });
}

// Define a quantidade de um item do carrinho atual (0 remove), sem passar do estoque da loja.
export async function setItemQuantity(itemId: string, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 0) throw new CartError("Quantidade inválida.");
  const cartId = await readCartId();
  const item = cartId
    ? await prisma.cartItem.findFirst({
        where: { id: itemId, cartId },
        select: { id: true, variantId: true },
      })
    : null;
  if (!item) throw new CartError("Este item não está mais no seu carrinho.");

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
    return { quantity: 0, limited: false };
  }

  const { stock } = await sellableVariant(item.variantId);
  if (stock <= 0) throw new CartError("Este produto está esgotado. Remova-o do carrinho.");
  const final = Math.min(quantity, stock, MAX_QUANTITY_PER_ITEM);
  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: final } });
  return { quantity: final, limited: final < quantity };
}

// Troca o destino de um item: para o abrigo ou para o cliente (KAN-30). Se o mesmo produto já
// estiver no outro destino, as quantidades se juntam.
export async function setItemDonation(itemId: string, donation: boolean) {
  const cartId = await readCartId();
  const item = cartId
    ? await prisma.cartItem.findFirst({
        where: { id: itemId, cartId },
        select: { id: true, cartId: true, variantId: true, quantity: true, donation: true },
      })
    : null;
  if (!item) throw new CartError("Este item não está mais no seu carrinho.");
  if (item.donation === donation) return;

  const { stock, donationEligible } = await sellableVariant(item.variantId);
  if (donation && !donationEligible) {
    throw new CartError("Este produto não pode ser doado ao abrigo.");
  }
  const other = await prisma.cartItem.findUnique({
    where: {
      cartId_variantId_donation: { cartId: item.cartId, variantId: item.variantId, donation },
    },
    select: { id: true, quantity: true },
  });
  if (!other) {
    await prisma.cartItem.update({ where: { id: item.id }, data: { donation } });
    return;
  }
  const quantity = Math.max(
    1,
    Math.min(other.quantity + item.quantity, stock, MAX_QUANTITY_PER_ITEM),
  );
  await prisma.$transaction([
    prisma.cartItem.update({ where: { id: other.id }, data: { quantity } }),
    prisma.cartItem.delete({ where: { id: item.id } }),
  ]);
}
