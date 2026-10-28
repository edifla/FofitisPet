import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

// Limite de tentativas por janela fixa (KAN-122), guardado no banco (model RateLimit).

export type Limit = { limit: number; windowSeconds: number };

const MINUTE = 60;
const HOUR = 60 * MINUTE;

export const LIMITS = {
  // Login: por IP (vários e-mails) e por e-mail (vários IPs), contra adivinhação de senha.
  loginByIp: { limit: 30, windowSeconds: 15 * MINUTE },
  loginByEmail: { limit: 10, windowSeconds: 15 * MINUTE },
  signupByIp: { limit: 5, windowSeconds: HOUR },
  passwordResetByIp: { limit: 10, windowSeconds: HOUR },
  passwordResetByEmail: { limit: 3, windowSeconds: HOUR },
  checkoutByUser: { limit: 10, windowSeconds: 10 * MINUTE },
  // Cartão: poucas tentativas, contra teste de cartões roubados.
  cardByUser: { limit: 6, windowSeconds: 10 * MINUTE },
  pixByUser: { limit: 20, windowSeconds: 10 * MINUTE },
  receiptByUser: { limit: 5, windowSeconds: HOUR },
  adoptionByIp: { limit: 10, windowSeconds: HOUR },
  // Lya (KAN-127): cada pergunta custa uma chamada ao modelo.
  lyaByIp: { limit: 40, windowSeconds: HOUR },
  lyaByUser: { limit: 60, windowSeconds: HOUR },
} satisfies Record<string, Limit>;

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

// Conta uma tentativa e diz se ainda está dentro do limite. Uma única instrução no banco, para
// duas requisições ao mesmo tempo não escaparem do limite.
export async function hit(key: string, { limit, windowSeconds }: Limit): Promise<RateLimitResult> {
  const [row] = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimit" (key, count, "resetAt")
    VALUES (${key}, 1, now() + make_interval(secs => ${windowSeconds}))
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN "RateLimit"."resetAt" <= now() THEN 1 ELSE "RateLimit".count + 1 END,
      "resetAt" = CASE
        WHEN "RateLimit"."resetAt" <= now() THEN now() + make_interval(secs => ${windowSeconds})
        ELSE "RateLimit"."resetAt"
      END
    RETURNING count, "resetAt"`;
  return {
    allowed: row.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((row.resetAt.getTime() - Date.now()) / 1000)),
  };
}

// Várias chaves de uma vez (ex.: IP e e-mail): bloqueia se qualquer uma passou do limite.
export async function hitAll(checks: [string, Limit][]): Promise<RateLimitResult> {
  const results = await Promise.all(checks.map(([key, limit]) => hit(key, limit)));
  const blocked = results.filter((r) => !r.allowed);
  return blocked.length
    ? { allowed: false, retryAfterSeconds: Math.max(...blocked.map((r) => r.retryAfterSeconds)) }
    : { allowed: true, retryAfterSeconds: 0 };
}

export function tooManyMessage(retryAfterSeconds: number) {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return `Muitas tentativas. Tente de novo em ${minutes === 1 ? "1 minuto" : `${minutes} minutos`}.`;
}

// IP do cliente. Atrás da Vercel (ou de outro proxy confiável) o primeiro endereço de
// x-forwarded-for é o do cliente; sem proxy, o cabeçalho pode ser forjado, então o limite por IP
// é uma barreira a mais, não a única.
export function ipFrom(headerList: Headers) {
  const forwarded = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headerList.get("x-real-ip")?.trim() || "desconhecido";
}

export async function clientIp() {
  return ipFrom(await headers());
}

// Apaga contadores vencidos (chamado pela rotina periódica).
export async function pruneRateLimits() {
  const { count } = await prisma.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } });
  return count;
}
