import "server-only";
import { connection } from "next/server";
import type { Campaign } from "@/app/generated/prisma/client";
import { foodVariantWhere } from "@/lib/food";
import { prisma } from "@/lib/prisma";

// Campanhas de ração com meta em kg (KAN-42). O progresso vem das doações já entregues ao
// abrigo (pedidos SHELTER em DELIVERED, KAN-32) pagas dentro do período da campanha.

// Datas da campanha são dias inteiros no horário de Brasília. Do banco, chegam à meia-noite UTC.
const dayStart = (date: Date) => new Date(`${date.toISOString().slice(0, 10)}T00:00:00-03:00`);
const DAY_MS = 24 * 60 * 60 * 1000;

export function todayInBrazil() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export type CampaignProgress = {
  raisedGrams: number;
  donations: number;
  percent: number;
};

export async function campaignProgress(campaign: Campaign): Promise<CampaignProgress> {
  const items = await prisma.orderItem.findMany({
    where: {
      order: {
        destination: "SHELTER",
        status: "DELIVERED",
        paidAt: {
          gte: dayStart(campaign.startsAt),
          ...(campaign.endsAt && { lt: new Date(dayStart(campaign.endsAt).getTime() + DAY_MS) }),
        },
      },
      variant: foodVariantWhere(campaign.species),
    },
    select: { orderId: true, quantity: true, variant: { select: { weightGrams: true } } },
  });
  const raisedGrams = items.reduce((sum, i) => sum + i.quantity * (i.variant.weightGrams ?? 0), 0);
  return {
    raisedGrams,
    donations: new Set(items.map((i) => i.orderId)).size,
    percent: Math.min(100, Math.floor((raisedGrams / campaign.goalGrams) * 100)),
  };
}

// Campanhas no ar hoje, com o progresso, das que acabam primeiro para as sem data de fim.
export async function getActiveCampaigns() {
  // "Hoje" depende da hora do pedido: renderiza na hora, não no build.
  await connection();
  const today = new Date(`${todayInBrazil()}T00:00:00Z`);
  const campaigns = await prisma.campaign.findMany({
    where: {
      active: true,
      startsAt: { lte: today },
      OR: [{ endsAt: null }, { endsAt: { gte: today } }],
    },
    orderBy: [{ endsAt: { sort: "asc", nulls: "last" } }, { startsAt: "asc" }],
  });
  return Promise.all(
    campaigns.map(async (campaign) => ({
      ...campaign,
      progress: await campaignProgress(campaign),
    })),
  );
}

// Dias que faltam, contando hoje: 1 no último dia.
export function daysLeft(endsAt: Date | null) {
  if (!endsAt) return null;
  const today = new Date(`${todayInBrazil()}T00:00:00Z`);
  return Math.round((endsAt.getTime() - today.getTime()) / DAY_MS) + 1;
}
