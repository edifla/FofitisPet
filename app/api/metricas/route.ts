import { isBot, recordPageView } from "@/lib/monitoring";
import { hit, ipFrom } from "@/lib/rate-limit";

// Contagem anônima de visualizações (KAN-51): só o caminho. Sem cookies, sem IP gravado (o IP só
// passa pelo limite de tentativas, que expira em minutos).
const PRIVATE = /^\/(admin|api|conta|checkout|pedidos|redefinir-senha)(\/|$)/;

export async function POST(request: Request) {
  if (isBot(request.headers.get("user-agent")) || request.headers.get("dnt") === "1") {
    return new Response(null, { status: 204 });
  }
  const path = (await request.text()).slice(0, 300);
  if (!path.startsWith("/") || PRIVATE.test(path)) return new Response(null, { status: 204 });
  const limit = await hit(`pageview:ip:${ipFrom(request.headers)}`, {
    limit: 300,
    windowSeconds: 10 * 60,
  });
  if (limit.allowed) await recordPageView(path);
  return new Response(null, { status: 204 });
}
