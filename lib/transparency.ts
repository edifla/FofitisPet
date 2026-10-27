import "server-only";
import { connection } from "next/server";
import { foodVariantWhere } from "@/lib/food";
import { prisma } from "@/lib/prisma";

// Página de transparência (KAN-44): o que foi doado e entregue ao abrigo, o que foi consumido,
// o estoque atual e fotos. Doações contam quando entregues (pedido SHELTER em DELIVERED, KAN-32).

const DELIVERED_DONATION = { destination: "SHELTER", status: "DELIVERED" } as const;
const RECENT_DAYS = 30;
// Meses no gráfico de doações por mês.
const CHART_MONTHS = 6;

// "Maria Souza" → "Maria S."; doações anônimas não mostram nome (KAN-31).
export function donorLabel(name: string, anonymous: boolean) {
  if (anonymous) return "Doador anônimo";
  const [first, ...rest] = name.trim().split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last[0].toUpperCase()}.` : first;
}

export async function getTransparencyReport() {
  // Os totais dos últimos 30 dias dependem da hora do pedido.
  await connection();
  const since = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);

  const [
    totals,
    recentTotals,
    donors,
    deliveredItems,
    deliveredFood,
    consumedByVariant,
    consumedFood,
    shelterStock,
    recentDonations,
    photos,
    byMonth,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: DELIVERED_DONATION,
      _sum: { totalCents: true },
      _count: { _all: true },
    }),
    prisma.order.aggregate({
      where: { ...DELIVERED_DONATION, deliveredAt: { gte: since } },
      _sum: { totalCents: true },
      _count: { _all: true },
    }),
    prisma.order.groupBy({ by: ["userId"], where: DELIVERED_DONATION }),
    prisma.orderItem.groupBy({
      by: ["productName", "variantName"],
      where: { order: DELIVERED_DONATION },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 15,
    }),
    prisma.orderItem.findMany({
      where: { order: DELIVERED_DONATION, variant: foodVariantWhere() },
      select: { quantity: true, variant: { select: { weightGrams: true } } },
    }),
    prisma.shelterConsumption.groupBy({
      by: ["variantId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 15,
    }),
    prisma.shelterConsumption.findMany({
      where: { variant: foodVariantWhere() },
      select: { quantity: true, variant: { select: { weightGrams: true } } },
    }),
    prisma.stockLevel.findMany({
      where: { location: "SHELTER", quantity: { gt: 0 } },
      orderBy: { variant: { product: { name: "asc" } } },
      select: {
        quantity: true,
        variant: { select: { id: true, name: true, product: { select: { name: true } } } },
      },
    }),
    prisma.order.findMany({
      where: DELIVERED_DONATION,
      orderBy: { deliveredAt: "desc" },
      take: 10,
      select: {
        id: true,
        anonymous: true,
        deliveredAt: true,
        user: { select: { name: true } },
        items: { select: { productName: true, variantName: true, quantity: true } },
      },
    }),
    prisma.transparencyPhoto.findMany({
      orderBy: [{ takenOn: "desc" }, { createdAt: "desc" }],
      take: 24,
      select: { id: true, url: true, caption: true, takenOn: true },
    }),
    // Valor das doações entregues por mês (fuso de São Paulo).
    prisma.$queryRaw<{ month: string; cents: number; count: number }[]>`
      SELECT to_char(("deliveredAt" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM') AS month,
             SUM("totalCents")::int AS cents, COUNT(*)::int AS count
      FROM "Order"
      WHERE destination = 'SHELTER' AND status = 'DELIVERED'
        AND "deliveredAt" >= date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo') - make_interval(months => ${CHART_MONTHS - 1}::int)
      GROUP BY 1`,
  ]);

  const consumedVariants = await prisma.productVariant.findMany({
    where: { id: { in: consumedByVariant.map((c) => c.variantId) } },
    select: { id: true, name: true, product: { select: { name: true } } },
  });
  const variantName = new Map(
    consumedVariants.map((v) => [v.id, { productName: v.product.name, variantName: v.name }]),
  );
  const grams = (rows: { quantity: number; variant: { weightGrams: number | null } }[]) =>
    rows.reduce((sum, r) => sum + r.quantity * (r.variant.weightGrams ?? 0), 0);

  return {
    raisedCents: totals._sum.totalCents ?? 0,
    donationCount: totals._count._all,
    donorCount: donors.length,
    recentRaisedCents: recentTotals._sum.totalCents ?? 0,
    recentDonationCount: recentTotals._count._all,
    recentDays: RECENT_DAYS,
    deliveredFoodGrams: grams(deliveredFood),
    consumedFoodGrams: grams(consumedFood),
    deliveredItems: deliveredItems.map((row) => ({
      productName: row.productName,
      variantName: row.variantName,
      quantity: row._sum.quantity ?? 0,
    })),
    consumedItems: consumedByVariant.map((row) => ({
      ...(variantName.get(row.variantId) ?? { productName: "Item removido", variantName: "" }),
      quantity: row._sum.quantity ?? 0,
    })),
    shelterStock: shelterStock.map((row) => ({
      id: row.variant.id,
      productName: row.variant.product.name,
      variantName: row.variant.name,
      quantity: row.quantity,
    })),
    recentDonations: recentDonations.map((order) => ({
      id: order.id,
      donor: donorLabel(order.user.name, order.anonymous),
      deliveredAt: order.deliveredAt,
      items: order.items,
    })),
    photos,
    monthly: lastMonths(CHART_MONTHS).map((month) => {
      const row = byMonth.find((r) => r.month === month);
      return { month, cents: row?.cents ?? 0, count: row?.count ?? 0 };
    }),
  };
}

// Os últimos n meses (AAAA-MM), do mais antigo ao atual, no fuso de São Paulo.
function lastMonths(n: number) {
  const [year, month] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  })
    .format(new Date())
    .split("-")
    .map(Number);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(year, month - 1 - (n - 1 - i), 1));
    return d.toISOString().slice(0, 7);
  });
}
