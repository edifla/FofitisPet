import * as z from "zod";
import { isBot, recordError } from "@/lib/monitoring";
import { hit, ipFrom } from "@/lib/rate-limit";

// Erros do navegador, enviados pelas telas de erro (KAN-51).
const reportSchema = z.object({
  message: z.string().min(1).max(2000),
  stack: z.string().max(8000).optional(),
  path: z.string().max(500).startsWith("/"),
});

export async function POST(request: Request) {
  if (isBot(request.headers.get("user-agent"))) return new Response(null, { status: 204 });
  const body = await request.text();
  if (body.length > 12_000) return new Response(null, { status: 413 });
  const limit = await hit(`client-error:ip:${ipFrom(request.headers)}`, {
    limit: 20,
    windowSeconds: 10 * 60,
  });
  if (!limit.allowed) return new Response(null, { status: 429 });

  let parsed;
  try {
    parsed = reportSchema.safeParse(JSON.parse(body));
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!parsed.success) return new Response(null, { status: 400 });
  await recordError({ source: "client", ...parsed.data, routePath: null });
  return new Response(null, { status: 204 });
}
