import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

// Monitoramento sem serviço externo (KAN-51): erros agrupados e visualizações anônimas.

const MAX_MESSAGE = 1000;
const MAX_STACK = 4000;

// Tira a query (pode ter tokens) e mascara trechos longos e aleatórios do caminho, como o token de
// /redefinir-senha/<token> e ids de pedidos ou solicitações.
export function sanitizePath(path: string) {
  const [pathname] = path.split(/[?#]/);
  return (
    pathname
      .split("/")
      .map((segment) => (/^[A-Za-z0-9_-]{20,}$/.test(segment) ? ":id" : segment))
      .join("/")
      .slice(0, 200) || "/"
  );
}

export type ErrorReport = {
  source: "server" | "client";
  message: string;
  stack?: string | null;
  routePath?: string | null;
  path?: string | null;
  method?: string | null;
  routeType?: string | null;
  digest?: string | null;
};

// Grava o erro, somando ocorrências iguais. Nunca deixa um erro do monitoramento derrubar a
// requisição original.
export async function recordError(report: ErrorReport) {
  try {
    const message = report.message.trim().slice(0, MAX_MESSAGE) || "Erro sem mensagem";
    const routePath = report.routePath?.slice(0, 200) ?? null;
    const fingerprint = createHash("sha256")
      .update(`${report.source}\n${routePath ?? ""}\n${message}`)
      .digest("hex");
    const data = {
      stack: report.stack?.slice(0, MAX_STACK) ?? null,
      path: report.path ? sanitizePath(report.path) : null,
      method: report.method?.slice(0, 10) ?? null,
      routeType: report.routeType?.slice(0, 20) ?? null,
      digest: report.digest?.slice(0, 100) ?? null,
    };
    await prisma.errorLog.upsert({
      where: { fingerprint },
      create: { fingerprint, source: report.source, message, routePath, ...data },
      update: { ...data, count: { increment: 1 }, resolvedAt: null },
    });
    // A hora vem do banco: o erro pode acontecer durante a pré-renderização, onde o Next.js não
    // aceita new Date().
    await prisma.$executeRaw`UPDATE "ErrorLog" SET "lastSeenAt" = NOW() WHERE "fingerprint" = ${fingerprint}`;
  } catch (error) {
    console.error("Falha ao registrar erro no monitoramento:", error);
  }
}

// Bots e pré-visualizações de links não contam como visita.
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|whatsapp/i;

export function isBot(userAgent: string | null) {
  return !userAgent || BOT.test(userAgent);
}

// Conta uma visualização no dia (horário de Brasília) para o caminho.
export async function recordPageView(path: string) {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
    new Date(),
  );
  await prisma.$executeRaw`
    INSERT INTO "PageViewDaily" (day, path, views) VALUES (${day}::date, ${sanitizePath(path)}, 1)
    ON CONFLICT (day, path) DO UPDATE SET views = "PageViewDaily".views + 1`;
}

// Limpeza feita pela rotina periódica: erros resolvidos há mais de 90 dias e visualizações com
// mais de 13 meses.
export async function pruneMonitoring() {
  const now = Date.now();
  const [errors, views] = await Promise.all([
    prisma.errorLog.deleteMany({
      where: { resolvedAt: { lt: new Date(now - 90 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.pageViewDaily.deleteMany({
      where: { day: { lt: new Date(now - 400 * 24 * 60 * 60 * 1000) } },
    }),
  ]);
  return errors.count + views.count;
}
