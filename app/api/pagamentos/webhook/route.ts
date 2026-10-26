import { getGateway } from "@/lib/payments";
import { applyGatewayUpdate } from "@/lib/payments/service";
import { WebhookError } from "@/lib/payments/types";

// Avisos do gateway de pagamento (KAN-110). Cada aviso é aplicado uma única vez; reenvios do mesmo
// aviso respondem 200 sem efeito, para o gateway parar de tentar.
const MAX_BODY_BYTES = 64 * 1024;

export async function POST(request: Request) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) {
    console.error("PAYMENT_WEBHOOK_SECRET não configurado: webhook de pagamento recusado.");
    return Response.json({ error: "Webhook não configurado." }, { status: 503 });
  }

  let gateway;
  try {
    gateway = getGateway();
  } catch {
    return Response.json({ error: "Gateway indisponível." }, { status: 404 });
  }

  const body = await request.text();
  if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
    return Response.json({ error: "Corpo grande demais." }, { status: 413 });
  }

  let update;
  try {
    update = gateway.readWebhook({ headers: request.headers, body, secret });
  } catch (error) {
    if (error instanceof WebhookError) {
      return Response.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }

  const result = await applyGatewayUpdate(update);
  if (result === "unknown-payment") {
    console.warn(
      `Webhook ${update.eventId} para pagamento desconhecido ${update.providerPaymentId}.`,
    );
  }
  return Response.json({ result });
}
