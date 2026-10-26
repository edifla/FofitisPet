import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import * as z from "zod";
import { type CardCharge, GatewayInputError, type PaymentGateway, WebhookError } from "./types";

// Gateway simulado: não fala com nenhum provedor. Gera identificadores e códigos de mentira no
// mesmo formato que um gateway real, para o checkout e os pedidos funcionarem de ponta a ponta.
export const SIMULATED_PROVIDER = "simulado";

export const simulatedGateway: PaymentGateway = {
  name: SIMULATED_PROVIDER,

  async createPix({ reference, amountCents }) {
    const providerPaymentId = `sim_pix_${randomUUID()}`;
    const amount = (amountCents / 100).toFixed(2);
    // Parecido com um "copia e cola" de verdade, mas sem chave Pix válida: não paga nada.
    const qrCode = [
      "00020126580014BR.GOV.BCB.PIX0136SIMULADO-FOFITISPET-NAO-PAGAR",
      `5204000053039865406${amount.padStart(6, "0")}`,
      `5802BR5911FOFITISPET6009SAO PAULO62${String(reference.length + 4).padStart(2, "0")}05${String(reference.length).padStart(2, "0")}${reference}`,
      "6304SIMU",
    ].join("");
    return { providerPaymentId, qrCode };
  },

  async createCardPayment({ card }) {
    // Só cartões de teste: assim ninguém digita um cartão de verdade por engano.
    if (!TEST_CARDS.has(card.number)) {
      throw new GatewayInputError("Use um dos cartões de teste listados abaixo do formulário.");
    }
    const outcome = TEST_OUTCOMES[card.holderName.trim().toUpperCase()] ?? TEST_OUTCOMES.APRO;
    return { providerPaymentId: `sim_card_${randomUUID()}`, ...outcome };
  },

  // Aviso no formato do simulado: JSON assinado com HMAC-SHA256 do corpo no cabeçalho
  // x-simulado-signature ("sha256=<hex>"), com o segredo PAYMENT_WEBHOOK_SECRET.
  readWebhook({ headers, body, secret }) {
    const expected = Buffer.from(signSimulatedWebhook(body, secret));
    const received = Buffer.from(headers.get(SIGNATURE_HEADER) ?? "");
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      throw new WebhookError("Assinatura inválida.");
    }
    let json: unknown;
    try {
      json = JSON.parse(body);
    } catch {
      throw new WebhookError("Corpo inválido.");
    }
    const parsed = webhookSchema.safeParse(json);
    if (!parsed.success) throw new WebhookError("Corpo inválido.");
    const { id, type, data } = parsed.data;
    return {
      provider: SIMULATED_PROVIDER,
      eventId: id,
      type,
      providerPaymentId: data.id,
      status: data.status,
      statusDetail: data.status_detail ?? null,
      payload: parsed.data,
    };
  },
};

export const SIGNATURE_HEADER = "x-simulado-signature";

export function signSimulatedWebhook(body: string, secret: string) {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

const webhookSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.string().min(1).max(50),
  data: z.object({
    id: z.string().min(1).max(100),
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELED"]),
    status_detail: z.string().max(100).optional(),
  }),
});

// Os mesmos cartões e nomes de teste do Mercado Pago, para a troca na KAN-55 ser natural.
export const TEST_CARD_LIST = [
  { brand: "Mastercard", number: "5031 4332 1540 6351", cvv: "123" },
  { brand: "Visa", number: "4235 6477 2802 5682", cvv: "123" },
  { brand: "American Express", number: "3753 651535 56885", cvv: "1234" },
] as const;

const TEST_CARDS = new Set<string>(TEST_CARD_LIST.map((card) => card.number.replace(/\s/g, "")));

// O nome impresso decide o resultado.
const TEST_OUTCOMES: Record<string, Pick<CardCharge, "status" | "statusDetail">> = {
  APRO: { status: "APPROVED", statusDetail: "accredited" },
  OTHE: { status: "REJECTED", statusDetail: "cc_rejected_other_reason" },
  FUND: { status: "REJECTED", statusDetail: "cc_rejected_insufficient_amount" },
  SECU: { status: "REJECTED", statusDetail: "cc_rejected_bad_filled_security_code" },
};

export const TEST_HOLDER_NAMES = [
  { name: "APRO", result: "aprovado" },
  { name: "OTHE", result: "recusado" },
  { name: "FUND", result: "saldo insuficiente" },
  { name: "SECU", result: "código de segurança inválido" },
] as const;
