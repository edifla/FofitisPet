import { beforeEach, describe, expect, it, vi } from "vitest";
import { addItem, CartError } from "@/lib/cart";
import { buildDonationSummary, placeDonationOrder } from "@/lib/checkout";
import { campaignProgress } from "@/lib/campaigns";
import { addKitToCart } from "@/lib/kits";
import { expireOrderIfStale, PAYMENT_WINDOW_MINUTES } from "@/lib/orders";
import { payWithCard } from "@/lib/payments/service";
import { prisma } from "@/lib/prisma";
import { getTransparencyReport } from "@/lib/transparency";
import { createUser, createVariant, resetDatabase, stockOf } from "./support/factories";

// Compra para o abrigo (KAN-118): doação reserva na loja e, paga, vai para o estoque do abrigo.

const approvedCard = {
  card: { number: "4235647728025682", holderName: "APRO", expiry: "12/40", cvv: "123" },
  installments: 1,
  brand: "Visa",
};

async function donate(userId: string, anonymous = false) {
  const summary = await buildDonationSummary();
  if (!summary.ok) throw new Error(`resumo inválido: ${summary.reason}`);
  return placeDonationOrder(userId, { expectedTotalCents: summary.totalCents, anonymous });
}

describe("compra para o abrigo", () => {
  beforeEach(resetDatabase);

  it("cria a doação sem frete nem endereço, só com os itens marcados para o abrigo", async () => {
    const user = await createUser();
    const racao = await createVariant({ priceCents: 4000, stock: 10 });
    const brinquedo = await createVariant({ priceCents: 1500, categorySlug: "brinquedos" });
    await addItem(racao.id, 3, true);
    await addItem(brinquedo.id, 1); // compra para o cliente, fica de fora

    const order = await donate(user.id, true);
    const saved = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { items: true },
    });
    expect(saved).toMatchObject({
      destination: "SHELTER",
      status: "PENDING_PAYMENT",
      anonymous: true,
      shippingCents: 0,
      totalCents: 12000,
      shippingStreet: null,
    });
    expect(saved.items.map((i) => [i.variantId, i.quantity])).toEqual([[racao.id, 3]]);
    // Reservado na loja, ainda não no abrigo.
    expect(await stockOf(racao.id, "STORE")).toBe(7);
    expect(await stockOf(racao.id, "SHELTER")).toBe(0);
    const left = await prisma.cartItem.findMany();
    expect(left.map((i) => [i.variantId, i.donation])).toEqual([[brinquedo.id, false]]);
  });

  it("produto que não é doável não entra como doação", async () => {
    const variant = await createVariant({ donationEligible: false });
    await expect(addItem(variant.id, 1, true)).rejects.toThrow(CartError);
  });

  it("paga, entrega no abrigo e manda o comprovante", async () => {
    const send = vi.spyOn(await import("@/lib/email"), "sendEmail");
    const user = await createUser();
    const racao = await createVariant({ stock: 10, weightGrams: 15000 });
    await addItem(racao.id, 2, true);
    const order = await donate(user.id);

    expect(await payWithCard(user.id, order.number, approvedCard)).toEqual({ approved: true });

    const delivered = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(delivered.status).toBe("DELIVERED");
    expect(delivered.deliveredAt).not.toBeNull();
    expect(await stockOf(racao.id, "STORE")).toBe(8);
    expect(await stockOf(racao.id, "SHELTER")).toBe(2);
    const movements = await prisma.stockMovement.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: "asc" },
    });
    expect(movements.map((m) => [m.type, m.fromLocation, m.toLocation, m.quantity])).toEqual([
      ["DONATION_TRANSFER", "STORE", null, 2],
      ["DONATION_TRANSFER", null, "SHELTER", 2],
    ]);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining("Comprovante da sua doação") }),
    );

    // A doação entregue entra na transparência e nas campanhas.
    const report = await getTransparencyReport();
    expect(report).toMatchObject({
      raisedCents: delivered.totalCents,
      donationCount: 1,
      deliveredFoodGrams: 30000,
    });
    const campaign = await prisma.campaign.create({
      data: {
        title: "Inverno",
        slug: "inverno",
        description: "Campanha de teste.",
        goalGrams: 60000,
        startsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    });
    expect(await campaignProgress(campaign)).toEqual({
      raisedGrams: 30000,
      donations: 1,
      percent: 50,
    });
  });

  it("doação não paga expira e devolve o estoque à loja", async () => {
    const user = await createUser();
    const racao = await createVariant({ stock: 5 });
    await addItem(racao.id, 4, true);
    const order = await donate(user.id);
    expect(await stockOf(racao.id, "STORE")).toBe(1);

    await prisma.order.update({
      where: { id: order.id },
      data: { createdAt: new Date(Date.now() - (PAYMENT_WINDOW_MINUTES + 1) * 60 * 1000) },
    });
    expect(await expireOrderIfStale({ id: order.id })).toBe(true);
    expect(await stockOf(racao.id, "STORE")).toBe(5);
    expect(await stockOf(racao.id, "SHELTER")).toBe(0);
    expect((await getTransparencyReport()).donationCount).toBe(0);
  });

  it("kit de doação entra inteiro no carrinho ou não entra", async () => {
    const user = await createUser();
    const racao = await createVariant({ priceCents: 3000, stock: 5 });
    const sache = await createVariant({ priceCents: 300, stock: 2, weightGrams: 85 });
    const kit = await prisma.donationKit.create({
      data: {
        name: "Kit teste",
        slug: "kit-teste",
        description: "Kit criado no teste.",
        items: {
          create: [
            { variantId: racao.id, quantity: 1 },
            { variantId: sache.id, quantity: 6 },
          ],
        },
      },
    });

    await expect(addKitToCart(kit.id)).rejects.toThrow(/esgotado/);
    expect(await prisma.cartItem.count()).toBe(0);

    await prisma.stockLevel.update({
      where: { variantId_location: { variantId: sache.id, location: "STORE" } },
      data: { quantity: 10 },
    });
    await addKitToCart(kit.id);
    const order = await donate(user.id);
    expect(order).toBeDefined();
    const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.totalCents).toBe(3000 + 6 * 300);
  });
});
