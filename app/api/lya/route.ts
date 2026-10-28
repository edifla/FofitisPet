import Anthropic from "@anthropic-ai/sdk";
import * as z from "zod";
import { getCurrentUser } from "@/lib/dal";
import { askLya, LyaUnavailableError } from "@/lib/lya/assistant";
import { detectSensitive, SENSITIVE_REPLY } from "@/lib/lya/guard";
import { hitAll, ipFrom, LIMITS, type Limit } from "@/lib/rate-limit";

// Conversa com a Lya (KAN-127). O navegador manda o histórico a cada pergunta; o servidor não
// guarda nada da conversa e não registra o texto das mensagens em log.

const MAX_BODY = 40_000;

const conversationSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .min(1)
    .max(30)
    .refine((list) => list.at(-1)?.role === "user", { error: "A última mensagem é da pessoa." }),
});

const reply = (text: string, status = 200) => Response.json({ reply: text }, { status });

export async function POST(request: Request) {
  // Só o próprio site conversa com a Lya.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) {
    return new Response(null, { status: 403 });
  }

  const body = await request.text();
  if (body.length > MAX_BODY) return new Response(null, { status: 413 });
  let parsed;
  try {
    parsed = conversationSchema.safeParse(JSON.parse(body));
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!parsed.success) return new Response(null, { status: 400 });

  // Cartão ou CPF na última mensagem: responde sem enviar nada ao modelo.
  const last = parsed.data.messages.at(-1)!;
  const sensitive = detectSensitive(last.content);
  if (sensitive) return reply(SENSITIVE_REPLY[sensitive]);
  // Mensagens antigas com esses dados ficam de fora do que vai para o modelo.
  const history = parsed.data.messages.filter((m) => !detectSensitive(m.content));

  const user = await getCurrentUser();
  const checks: [string, Limit][] = [[`lya:ip:${ipFrom(request.headers)}`, LIMITS.lyaByIp]];
  if (user) checks.push([`lya:user:${user.id}`, LIMITS.lyaByUser]);
  const limit = await hitAll(checks);
  if (!limit.allowed) {
    const minutes = Math.ceil(limit.retryAfterSeconds / 60);
    return reply(
      `Conversamos bastante por agora! Para eu continuar ajudando todo mundo, volte a falar comigo em ${minutes === 1 ? "1 minuto" : `${minutes} minutos`}. Se for urgente, use o formulário em [/feedback](/feedback).`,
      429,
    );
  }

  try {
    const text = await askLya(history, user ? { id: user.id, name: user.name } : null);
    return reply(text);
  } catch (error) {
    if (error instanceof LyaUnavailableError) {
      return reply(
        "A Lya está tirando uma soneca agora e volta logo. Enquanto isso, você pode falar com a gente pelo [formulário de contato](/feedback).",
        503,
      );
    }
    if (
      error instanceof Anthropic.RateLimitError ||
      error instanceof Anthropic.InternalServerError
    ) {
      return reply(
        "Estou com muita gente para atender agora. Pode tentar de novo em instantes?",
        503,
      );
    }
    // Outros erros vão para o monitoramento (onRequestError), sem o texto da conversa.
    throw error;
  }
}
