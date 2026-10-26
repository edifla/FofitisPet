import "server-only";
import { getUserAddress, type SavedAddress } from "@/lib/addresses";
import { getCart, readCartId, type CartLine } from "@/lib/cart";
import { sendOrderEmail } from "@/lib/order-emails";
import { prisma } from "@/lib/prisma";
import { quoteShipping, type ShippingOption, type ShippingQuote } from "@/lib/shipping";
import { InsufficientStockError, moveStock } from "@/lib/stock";

// Cálculo do checkout, usado pelo resumo (KAN-106) e pela criação do pedido (KAN-107),
// para que o cliente confirme exatamente o que será cobrado.

export type CheckoutSummary =
  | { ok: false; reason: "empty-cart" | "invalid-address" | "over-stock"; lines?: CartLine[] }
  | {
      ok: true;
      address: SavedAddress;
      lines: CartLine[];
      unavailable: CartLine[];
      subtotalCents: number;
      quote: ShippingQuote;
      shipping: ShippingOption;
      totalCents: number;
    };

export async function buildCheckoutSummary(
  userId: string,
  addressId: string,
  shippingId: string | undefined,
): Promise<CheckoutSummary> {
  const [cart, address] = await Promise.all([getCart(), getUserAddress(userId, addressId)]);
  // Itens para o abrigo vão no checkout da doação (KAN-31), sem frete.
  const lines = cart.items.filter((line) => line.available && !line.donation);
  if (lines.length === 0) return { ok: false, reason: "empty-cart" };
  if (!address) return { ok: false, reason: "invalid-address" };
  // Mais unidades no carrinho do que há na loja: o cliente precisa ajustar antes.
  if (lines.some((line) => line.overStock)) return { ok: false, reason: "over-stock", lines };

  const quote = quoteShipping({
    zipCode: address.zipCode,
    items: lines.map((line) => ({ weightGrams: line.weightGrams, quantity: line.quantity })),
    subtotalCents: cart.subtotalCents,
  });
  if (!quote) return { ok: false, reason: "invalid-address" };
  const shipping = quote.options.find((o) => o.id === shippingId) ?? quote.options[0];

  return {
    ok: true,
    address,
    lines,
    unavailable: cart.items.filter((line) => !line.available),
    subtotalCents: cart.subtotalCents,
    quote,
    shipping,
    totalCents: cart.subtotalCents + shipping.priceCents,
  };
}

export class CheckoutError extends Error {}

const summaryErrors = {
  "empty-cart": "Seu carrinho está vazio ou sem itens disponíveis.",
  "invalid-address": "Escolha um endereço de entrega válido.",
  "over-stock": "Alguns itens passaram do estoque disponível. Ajuste o carrinho.",
} as const;

// Cria o pedido (KAN-107): refaz o cálculo do resumo e, numa transação só, grava o pedido com a
// cópia dos itens e do endereço, baixa o estoque da loja e tira os itens do carrinho.
export async function placeOrder(
  userId: string,
  input: { addressId: string; shippingId: string; expectedTotalCents: number },
) {
  const summary = await buildCheckoutSummary(userId, input.addressId, input.shippingId);
  if (!summary.ok) throw new CheckoutError(summaryErrors[summary.reason]);
  // O cliente confirma o total que viu; se preço, frete ou itens mudaram, ele revisa de novo.
  if (summary.totalCents !== input.expectedTotalCents) {
    throw new CheckoutError(
      "Os valores mudaram desde o resumo. Confira o pedido e confirme de novo.",
    );
  }
  const cartId = await readCartId();
  const { address, lines, shipping } = summary;

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          destination: "CUSTOMER",
          status: "PENDING_PAYMENT",
          subtotalCents: summary.subtotalCents,
          shippingCents: shipping.priceCents,
          totalCents: summary.totalCents,
          shippingRecipientName: address.recipientName,
          shippingZipCode: address.zipCode,
          shippingStreet: address.street,
          shippingNumber: address.number,
          shippingComplement: address.complement,
          shippingNeighborhood: address.neighborhood,
          shippingCity: address.city,
          shippingState: address.state,
          shippingMethod: `${shipping.name} · até ${shipping.days} dia(s) útil(eis)`,
          items: {
            create: lines.map((line) => ({
              variantId: line.variantId,
              productName: line.productName,
              variantName: line.variantName,
              unitPriceCents: line.unitPriceCents,
              quantity: line.quantity,
              totalCents: line.totalCents,
            })),
          },
        },
        select: { id: true, number: true },
      });
      // Reserva o estoque já no pedido, para não vender a mesma unidade duas vezes.
      // Pedidos não pagos devolvem o estoque ao serem cancelados (KAN-110).
      for (const line of lines) {
        await moveStock(tx, {
          variantId: line.variantId,
          type: "SALE",
          from: "STORE",
          to: null,
          quantity: line.quantity,
          orderId: order.id,
          createdById: userId,
        });
      }
      if (cartId) {
        await tx.cartItem.deleteMany({
          where: {
            cartId,
            donation: false,
            variantId: { in: lines.map((line) => line.variantId) },
          },
        });
      }
      return order;
    });
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      throw new CheckoutError(
        "Um dos itens acabou de esgotar. Confira o carrinho e tente de novo.",
      );
    }
    throw error;
  }
  await sendOrderEmail(order.id, "created");
  return order;
}
