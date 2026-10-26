import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as expireRoute } from "@/app/api/pedidos/expirar/route";
import { POST as webhook } from "@/app/api/pagamentos/webhook/route";
import { addItem } from "@/lib/cart";
import {
  buildCheckoutSummary,
  buildDonationSummary,
  placeDonationOrder,
  placeOrder,
} from "@/lib/checkout";
import { PAYMENT_WINDOW_MINUTES } from "@/lib/orders";
import { SIGNATURE_HEADER, signSimulatedWebhook } from "@/lib/payments/simulated";
import { startPixPayment } from "@/lib/payments/service";
import { prisma } from "@/lib/prisma";
import {
  createAddress,
  createUser,
  createVariant,
  resetDatabase,
  stockOf,
} from "./support/factories";

// Webhooks de pagamento (KAN-120): assinatura, idempotência e efeitos no pedido.

const SECRET = "segredo-dos-testes";

function call(payload: unknown, { secret = SECRET, raw }: { secret?: string; raw?: string } = {}) {
  const body = raw ?? JSON.stringify(payload);
  return webhook(
    new Request("http://localhost/api/pagamentos/webhook", {
      method: "POST",
      body,
      headers: { [SIGNATURE_HEADER]: signSimulatedWebhook(body, secret) },
    }),
  );
}

// O id do pagamento no gateway é opcional no schema; nos pagamentos criados aqui ele sempre existe.
const event = (id: string, paymentId: string | null, status: string) => ({
  id,
  type: "payment.updated",
  data: { id: paymentId ?? "", status },
});

async function pixOrder(stock = 5) {
  const user = await createUser();
  const address = await createAddress(user.id);
  const variant = await createVariant({ stock });
  await addItem(variant.id, 1);
  const summary = await buildCheckoutSummary(user.id, address.id, "economica");
  if (!summary.ok) throw new Error("resumo inválido");
  const order = await placeOrder(user.id, {
    addressId: address.id,
    shippingId: summary.shipping.id,
    expectedTotalCents: summary.totalCents,
  });
  const { id } = await startPixPayment(user.id, order.number);
  const payment = await prisma.payment.findUniqueOrThrow({ where: { id } });
  return { user, order, variant, providerPaymentId: payment.providerPaymentId };
}

const orderStatus = async (id: string) =>
  (await prisma.order.findUniqueOrThrow({ where: { id } })).status;

describe("webhook de pagamento", () => {
  beforeEach(async () => {
    await resetDatabase();
    process.env.PAYMENT_WEBHOOK_SECRET = SECRET;
  });
  afterEach(() => {
    delete process.env.PAYMENT_WEBHOOK_SECRET;
  });

  it("recusa sem segredo configurado, com assinatura errada, corpo inválido ou grande demais", async () => {
    delete process.env.PAYMENT_WEBHOOK_SECRET;
    expect((await call(event("e1", "x", "APPROVED"))).status).toBe(503);
    process.env.PAYMENT_WEBHOOK_SECRET = SECRET;

    expect((await call(event("e1", "x", "APPROVED"), { secret: "outro" })).status).toBe(401);
    expect((await call(null, { raw: "não é json" })).status).toBe(401);
    expect((await call({ id: "e1", data: { status: "PAGO" } })).status).toBe(401);
    expect((await call(null, { raw: "x".repeat(65 * 1024) })).status).toBe(413);
    expect(await prisma.paymentEvent.count()).toBe(0);
  });

  it("aprova o Pix, uma vez só, mesmo com o aviso repetido", async () => {
    const { order, providerPaymentId } = await pixOrder();

    const first = await call(event("evt-1", providerPaymentId, "APPROVED"));
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ result: "applied" });
    expect(await orderStatus(order.id)).toBe("PAID");

    const again = await call(event("evt-1", providerPaymentId, "APPROVED"));
    expect(await again.json()).toEqual({ result: "duplicate" });
    expect(await prisma.paymentEvent.count()).toBe(1);

    // Um aviso atrasado de "pendente" não desfaz o pagamento.
    const late = await call(event("evt-0", providerPaymentId, "PENDING"));
    expect(await late.json()).toEqual({ result: "ignored" });
    expect(await orderStatus(order.id)).toBe("PAID");
    const payment = await prisma.payment.findFirstOrThrow({ where: { providerPaymentId } });
    expect(payment.status).toBe("APPROVED");
  });

  it("registra aviso de pagamento desconhecido sem quebrar", async () => {
    const response = await call(event("evt-x", "sim_pix_desconhecido", "APPROVED"));
    expect(await response.json()).toEqual({ result: "unknown-payment" });
    expect(await prisma.paymentEvent.count()).toBe(1);
  });

  it("Pix recusado deixa o pedido aguardando outro pagamento", async () => {
    const { order, providerPaymentId } = await pixOrder();
    await call(event("evt-r", providerPaymentId, "REJECTED"));
    expect(await orderStatus(order.id)).toBe("PENDING_PAYMENT");
  });

  it("Pix pago depois do prazo fica marcado para estorno, sem reabrir o pedido", async () => {
    const { order, providerPaymentId, variant } = await pixOrder(3);
    await prisma.order.update({
      where: { id: order.id },
      data: { createdAt: new Date(Date.now() - (PAYMENT_WINDOW_MINUTES + 5) * 60 * 1000) },
    });
    process.env.CRON_SECRET = "cron-dos-testes";
    const runCron = (authorization?: string) =>
      expireRoute(
        new Request("http://localhost/api/pedidos/expirar", {
          method: "POST",
          headers: authorization ? { authorization } : {},
        }),
      );
    expect((await runCron()).status).toBe(401);
    expect((await runCron("Bearer errado")).status).toBe(401);

    // Com o Pix ainda válido, o cliente pode estar pagando: o pedido não expira.
    expect(await (await runCron("Bearer cron-dos-testes")).json()).toEqual({ canceled: 0 });
    expect(await orderStatus(order.id)).toBe("PENDING_PAYMENT");

    await prisma.payment.updateMany({
      where: { providerPaymentId },
      data: { pixExpiresAt: new Date(Date.now() - 60 * 1000) },
    });
    expect(await (await runCron("Bearer cron-dos-testes")).json()).toEqual({ canceled: 1 });
    delete process.env.CRON_SECRET;
    expect(await orderStatus(order.id)).toBe("CANCELED");
    expect(await stockOf(variant.id, "STORE")).toBe(3);

    await call(event("evt-late", providerPaymentId, "APPROVED"));
    expect(await orderStatus(order.id)).toBe("CANCELED");
    const payment = await prisma.payment.findFirstOrThrow({ where: { providerPaymentId } });
    expect(payment).toMatchObject({
      status: "APPROVED",
      statusDetail: "approved_after_order_closed",
    });
  });

  it("Pix de doação aprovado entrega no abrigo", async () => {
    const user = await createUser();
    const racao = await createVariant({ stock: 4 });
    await addItem(racao.id, 2, true);
    const summary = await buildDonationSummary();
    if (!summary.ok) throw new Error("resumo inválido");
    const order = await placeDonationOrder(user.id, {
      expectedTotalCents: summary.totalCents,
      anonymous: false,
    });
    const { id } = await startPixPayment(user.id, order.number);
    const { providerPaymentId } = await prisma.payment.findUniqueOrThrow({ where: { id } });

    await call(event("evt-d", providerPaymentId, "APPROVED"));
    expect(await orderStatus(order.id)).toBe("DELIVERED");
    expect(await stockOf(racao.id, "SHELTER")).toBe(2);
    expect(await stockOf(racao.id, "STORE")).toBe(2);
  });
});
