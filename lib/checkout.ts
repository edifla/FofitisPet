import "server-only";
import { getUserAddress, type SavedAddress } from "@/lib/addresses";
import { getCart, type CartLine } from "@/lib/cart";
import { quoteShipping, type ShippingOption, type ShippingQuote } from "@/lib/shipping";

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
  const lines = cart.items.filter((line) => line.available);
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
