import { timingSafeEqual } from "node:crypto";
import { expireStaleOrders } from "@/lib/orders";

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
  return Response.json({ canceled });
}

export { handle as GET, handle as POST };
