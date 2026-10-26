import { beforeEach, describe, expect, it } from "vitest";
import { addItem } from "@/lib/cart";
import { buildCheckoutSummary, CheckoutError, placeOrder } from "@/lib/checkout";
import { expireOrderIfStale, PAYMENT_WINDOW_MINUTES } from "@/lib/orders";
import { payWithCard } from "@/lib/payments/service";
import { prisma } from "@/lib/prisma";
import {
  createAddress,
  createUser,
  createVariant,
  resetDatabase,
  stockOf,
} from "./support/factories";
import { resetCookies } from "./support/setup";

// Checkout da loja (KAN-117): pedido, reserva de estoque, pagamento e expiração.

const card = (holderName = "APRO") => ({
  card: { number: "5031433215406351", holderName, expiry: "12/40", cvv: "123" },
  installments: 1,
  brand: "Mastercard",
});

async function checkout(userId: string, addressId: string) {
  const summary = await buildCheckoutSummary(userId, addressId, "economica");
  if (!summary.ok) throw new Error(`resumo inválido: ${summary.reason}`);
  return placeOrder(userId, {
    addressId,
    shippingId: summary.shipping.id,
    expectedTotalCents: summary.totalCents,
  });
}

describe("checkout", () => {
  beforeEach(resetDatabase);

  it("cria o pedido, reserva o estoque e esvazia só os itens comprados do carrinho", async () => {
    const user = await createUser();
    const address = await createAddress(user.id);
    const racao = await createVariant({ priceCents: 4000, stock: 5 });
    const doacao = await createVariant({ priceCents: 1000, stock: 5 });
    await addItem(racao.id, 2);
    await addItem(doacao.id, 1, true);

    const summary = await buildCheckoutSummary(user.id, address.id, "economica");
    expect(summary.ok).toBe(true);
    if (!summary.ok) return;
    expect(summary.subtotalCents).toBe(8000);
    expect(summary.lines.map((l) => l.variantId)).toEqual([racao.id]);

    const order = await placeOrder(user.id, {
      addressId: address.id,
      shippingId: summary.shipping.id,
      expectedTotalCents: summary.totalCents,
    });
    const saved = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { items: true },
    });
    expect(saved).toMatchObject({
      status: "PENDING_PAYMENT",
      destination: "CUSTOMER",
      subtotalCents: 8000,
      totalCents: summary.totalCents,
      shippingCity: "Campinas",
    });
    expect(saved.items).toHaveLength(1);
    expect(saved.items[0]).toMatchObject({ quantity: 2, unitPriceCents: 4000, totalCents: 8000 });
    expect(await stockOf(racao.id, "STORE")).toBe(3);
    // O item de doação continua no carrinho, para o checkout da doação.
    const left = await prisma.cartItem.findMany();
    expect(left.map((i) => [i.variantId, i.donation])).toEqual([[doacao.id, true]]);
  });

  it("recusa se o total mudou desde o resumo", async () => {
    const user = await createUser();
    const address = await createAddress(user.id);
    const variant = await createVariant({ priceCents: 4000 });
    await addItem(variant.id, 1);
    const summary = await buildCheckoutSummary(user.id, address.id, "economica");
    if (!summary.ok) throw new Error("resumo inválido");
    await prisma.productVariant.update({ where: { id: variant.id }, data: { priceCents: 4500 } });

    await expect(
      placeOrder(user.id, {
        addressId: address.id,
        shippingId: summary.shipping.id,
        expectedTotalCents: summary.totalCents,
      }),
    ).rejects.toThrow(/valores mudaram/);
    expect(await prisma.order.count()).toBe(0);
    expect(await stockOf(variant.id, "STORE")).toBe(10);
  });

  it("não aceita endereço de outro cliente nem carrinho vazio", async () => {
    const user = await createUser();
    const other = await createUser("CUSTOMER", "Bruno Lima");
    const foreign = await createAddress(other.id);
    const variant = await createVariant();

    await expect(
      placeOrder(user.id, {
        addressId: foreign.id,
        shippingId: "economica",
        expectedTotalCents: 1,
      }),
    ).rejects.toThrow(CheckoutError);

    await addItem(variant.id, 1);
    const summary = await buildCheckoutSummary(user.id, foreign.id, "economica");
    expect(summary).toMatchObject({ ok: false, reason: "invalid-address" });
  });

  it("não vende a mesma unidade duas vezes", async () => {
    const variant = await createVariant({ stock: 1 });
    const ana = await createUser();
    const anaAddress = await createAddress(ana.id);
    await addItem(variant.id, 1);
    const anaSummary = await buildCheckoutSummary(ana.id, anaAddress.id, "economica");

    resetCookies(); // outro navegador
    const bruno = await createUser("CUSTOMER", "Bruno Lima");
    const brunoAddress = await createAddress(bruno.id);
    await addItem(variant.id, 1);
    await checkout(bruno.id, brunoAddress.id);
    expect(await stockOf(variant.id, "STORE")).toBe(0);

    if (!anaSummary.ok) throw new Error("resumo inválido");
    await expect(
      placeOrder(ana.id, {
        addressId: anaAddress.id,
        shippingId: anaSummary.shipping.id,
        expectedTotalCents: anaSummary.totalCents,
      }),
    ).rejects.toThrow(CheckoutError);
    expect(await prisma.order.count()).toBe(1);
    expect(await stockOf(variant.id, "STORE")).toBe(0);
  });

  it("paga no cartão aprovado e recusa o cartão sem saldo", async () => {
    const user = await createUser();
    const address = await createAddress(user.id);
    const variant = await createVariant();
    await addItem(variant.id, 1);
    const order = await checkout(user.id, address.id);

    expect(await payWithCard(user.id, order.number, card("FUND"))).toMatchObject({
      approved: false,
    });
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe(
      "PENDING_PAYMENT",
    );

    expect(await payWithCard(user.id, order.number, card("APRO"))).toEqual({ approved: true });
    const paid = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { payments: true },
    });
    expect(paid.status).toBe("PAID");
    expect(paid.paidAt).not.toBeNull();
    // Do cartão, só a bandeira e os 4 últimos dígitos ficam guardados.
    expect(paid.payments.map((p) => [p.status, p.cardLastFour])).toEqual(
      expect.arrayContaining([
        ["REJECTED", "6351"],
        ["APPROVED", "6351"],
      ]),
    );
    expect(JSON.stringify(paid.payments)).not.toContain("5031433215406351");

    await expect(payWithCard(user.id, order.number, card())).rejects.toThrow(
      /não está aguardando pagamento/,
    );
  });

  it("cancela o pedido não pago depois do prazo e devolve o estoque", async () => {
    const user = await createUser();
    const address = await createAddress(user.id);
    const variant = await createVariant({ stock: 4 });
    await addItem(variant.id, 3);
    const order = await checkout(user.id, address.id);
    expect(await stockOf(variant.id, "STORE")).toBe(1);

    expect(await expireOrderIfStale({ id: order.id })).toBe(false);
    await prisma.order.update({
      where: { id: order.id },
      data: { createdAt: new Date(Date.now() - (PAYMENT_WINDOW_MINUTES + 1) * 60 * 1000) },
    });
    expect(await expireOrderIfStale({ id: order.id })).toBe(true);

    const canceled = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(canceled.status).toBe("CANCELED");
    expect(await stockOf(variant.id, "STORE")).toBe(4);
    await expect(payWithCard(user.id, order.number, card())).rejects.toThrow();
  });
});
