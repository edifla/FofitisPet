import "server-only";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

// Dados do painel do abrigo no admin (KAN-34).

export async function getShelterPanel() {
  await requireAdmin();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [levels, consumptions, lastMonth, animals] = await Promise.all([
    prisma.stockLevel.findMany({
      where: { location: "SHELTER", OR: [{ quantity: { gt: 0 } }, { targetQuantity: { gt: 0 } }] },
      orderBy: [{ variant: { product: { name: "asc" } } }, { variant: { name: "asc" } }],
      select: {
        quantity: true,
        targetQuantity: true,
        variant: { select: { id: true, name: true, product: { select: { name: true } } } },
      },
    }),
    prisma.shelterConsumption.findMany({
      orderBy: [{ consumedAt: "desc" }, { createdAt: "desc" }],
      take: 50,
      select: {
        id: true,
        quantity: true,
        consumedAt: true,
        note: true,
        variant: { select: { name: true, product: { select: { name: true } } } },
        animal: { select: { name: true } },
        recordedBy: { select: { name: true } },
      },
    }),
    prisma.shelterConsumption.groupBy({
      by: ["variantId"],
      where: { consumedAt: { gte: since } },
      _sum: { quantity: true },
    }),
    prisma.animal.findMany({
      where: { status: { not: "ADOPTED" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const usedLastMonth = new Map(lastMonth.map((row) => [row.variantId, row._sum.quantity ?? 0]));
  const stock = levels.map(({ quantity, targetQuantity, variant }) => ({
    variantId: variant.id,
    label: `${variant.product.name} · ${variant.name}`,
    quantity,
    target: targetQuantity,
    usedLastMonth: usedLastMonth.get(variant.id) ?? 0,
  }));
  return { stock, consumptions, animals };
}
