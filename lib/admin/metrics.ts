import "server-only";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

// Números do painel de métricas (KAN-51).
export const METRICS_DAYS = 30;

export async function getMetrics(days = METRICS_DAYS) {
  await requireAdmin();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const sinceDay = new Date(`${since.toISOString().slice(0, 10)}T00:00:00Z`);

  const [viewsByDay, topPages, signups, sales, donations, adoptionRequests, approved, openErrors] =
    await Promise.all([
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
        take: 10,
      }),
      prisma.user.count({ where: { createdAt: { gte: since }, deletedAt: null } }),
      prisma.order.aggregate({
        where: {
          destination: "CUSTOMER",
          paidAt: { gte: since },
          status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] },
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
    ]);

  return {
    viewsByDay,
    topPages,
    signups,
    sales,
    donations,
    adoptionRequests,
    approved,
    openErrors,
  };
}
