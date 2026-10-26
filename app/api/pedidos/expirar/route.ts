import { timingSafeEqual } from "node:crypto";
import { expireStaleOrders } from "@/lib/orders";
import { pruneMonitoring } from "@/lib/monitoring";
import { pruneRateLimits } from "@/lib/rate-limit";

// Rotina periódica (cron) que cancela pedidos não pagos fora do prazo e devolve o estoque
// (KAN-110). Protegida por "Authorization: Bearer <CRON_SECRET>". GET para funcionar com o cron
// da Vercel; POST para outros agendadores.
async function handle(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "Rotina não configurada." }, { status: 503 });

  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const canceled = await expireStaleOrders();
  // Aproveita a rotina para apagar contadores de tentativas vencidos (KAN-122).
  const rateLimitsPruned = await pruneRateLimits();
  // E registros antigos do monitoramento (KAN-51).
  const monitoringPruned = await pruneMonitoring();
  return Response.json({ canceled, rateLimitsPruned, monitoringPruned });
}

export { handle as GET, handle as POST };
