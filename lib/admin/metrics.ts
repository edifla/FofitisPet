import "server-only";
import type { AdoptionRequestStatus } from "@/app/generated/prisma/client";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

// Números do painel de métricas (KAN-51) e do painel inicial do admin.
export const METRICS_DAYS = 30;
// Períodos oferecidos no filtro da tela de métricas.
export const METRICS_RANGES = [7, 30, 90] as const;

export function parseMetricsDays(value: unknown) {
  const days = Number(value);
  return (METRICS_RANGES as readonly number[]).includes(days) ? days : METRICS_DAYS;
}

const PAID_STATUSES = ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] as const;

// Dias (AAAA-MM-DD, no fuso de São Paulo) do período, do mais antigo ao de hoje, para os gráficos
// não pularem dias sem movimento.
function dayKeys(days: number, now: number) {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" });
  return Array.from({ length: days }, (_, i) =>
    fmt.format(new Date(now - (days - 1 - i) * 24 * 60 * 60 * 1000)),
  );
}

export async function getMetrics(days = METRICS_DAYS) {
  await requireAdmin();
  const now = Date.now();
  const since = new Date(now - days * 24 * 60 * 60 * 1000);
  const sinceDay = new Date(`${since.toISOString().slice(0, 10)}T00:00:00Z`);

  const [
    viewsByDay,
    topPages,
    signups,
    sales,
    donations,
    adoptionRequests,
    approved,
    openErrors,
    ordersByDay,
    requestsByStatus,
  ] = await Promise.all([
    prisma.pageViewDaily.groupBy({
      by: ["day"],
      where: { day: { gte: sinceDay } },
      _sum: { views: true },
      orderBy: { day: "asc" },
    }),
    prisma.pageViewDaily.groupBy({
      by: ["path"],
      where: { day: { gte: sinceDay } },
      _sum: { views: true },
      orderBy: { _sum: { views: "desc" } },
      take: 8,
    }),
    prisma.user.count({ where: { createdAt: { gte: since }, deletedAt: null } }),
    prisma.order.aggregate({
      where: {
        destination: "CUSTOMER",
        paidAt: { gte: since },
        status: { in: [...PAID_STATUSES] },
      },
      _count: { _all: true },
      _sum: { totalCents: true },
    }),
    prisma.order.aggregate({
      where: { destination: "SHELTER", status: "DELIVERED", paidAt: { gte: since } },
      _count: { _all: true },
      _sum: { totalCents: true },
    }),
    prisma.adoptionRequest.count({ where: { createdAt: { gte: since } } }),
    prisma.adoptionRequest.count({ where: { status: "APPROVED", decidedAt: { gte: since } } }),
    prisma.errorLog.count({ where: { resolvedAt: null } }),
    // Valor pago por dia, separado entre vendas e doações.
    prisma.$queryRaw<{ day: string; destination: "CUSTOMER" | "SHELTER"; cents: number }[]>`
      SELECT to_char(("paidAt" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD') AS day,
             destination, SUM("totalCents")::int AS cents
      FROM "Order"
      WHERE "paidAt" >= ${since}
        AND status IN ('PAID', 'PREPARING', 'SHIPPED', 'DELIVERED')
      GROUP BY 1, 2`,
    prisma.adoptionRequest.groupBy({
      by: ["status"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
  ]);

  const keys = dayKeys(days, now);
  const views = new Map(
    viewsByDay.map((row) => [row.day.toISOString().slice(0, 10), row._sum.views ?? 0]),
  );
  const salesDay = new Map<string, number>();
  const donationsDay = new Map<string, number>();
  for (const row of ordersByDay) {
    (row.destination === "CUSTOMER" ? salesDay : donationsDay).set(row.day, row.cents);
  }

  return {
    days,
    viewsByDay,
    topPages,
    signups,
    sales,
    donations,
    adoptionRequests,
    approved,
    openErrors,
    // Séries diárias, com zero nos dias sem movimento.
    daily: keys.map((day) => ({
      day,
      views: views.get(day) ?? 0,
      salesCents: salesDay.get(day) ?? 0,
      donationsCents: donationsDay.get(day) ?? 0,
    })),
    requestsByStatus: requestsByStatus.map((row) => ({
      status: row.status as AdoptionRequestStatus,
      count: row._count._all,
    })),
  };
}

// Resumo do painel inicial: o que precisa de atenção agora.
export async function getDashboard() {
  await requireAdmin();
  const [toShip, newRequests, openErrors, newFeedback, lowStock, recentOrders] = await Promise.all([
    prisma.order.count({
      where: { destination: "CUSTOMER", status: { in: ["PAID", "PREPARING"] } },
    }),
    prisma.adoptionRequest.count({ where: { status: "RECEIVED" } }),
    prisma.errorLog.count({ where: { resolvedAt: null } }),
    prisma.feedback.count({ where: { status: "NEW" } }),
    prisma.stockLevel.count({
      where: {
        location: "STORE",
        quantity: { lte: 3 },
        variant: { active: true, product: { is: { active: true, archivedAt: null } } },
      },
    }),
    prisma.order.findMany({
      where: { paidAt: { not: null } },
      orderBy: { paidAt: "desc" },
      take: 6,
      select: {
        id: true,
        number: true,
        destination: true,
        status: true,
        totalCents: true,
        paidAt: true,
        user: { select: { name: true } },
      },
    }),
  ]);
  return { toShip, newRequests, openErrors, newFeedback, lowStock, recentOrders };
}
