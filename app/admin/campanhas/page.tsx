import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { campaignProgress, todayInBrazil } from "@/lib/campaigns";
import { requireAdmin } from "@/lib/dal";
import { formatFoodTotal } from "@/lib/food";
import { speciesLabels } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Campanhas" };

// Datas sem hora vêm do banco à meia-noite UTC.
const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" });

// Campanhas de ração (KAN-42).
export default function CampaignsPage() {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Campanhas de ração</h1>
        <Link
          href="/admin/campanhas/nova"
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Nova campanha
        </Link>
      </div>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <CampaignList />
      </Suspense>
    </>
  );
}

async function CampaignList() {
  await requireAdmin();
  const campaigns = await prisma.campaign.findMany({ orderBy: { startsAt: "desc" } });
  if (campaigns.length === 0) {
    return <p className="text-zinc-500">Nenhuma campanha cadastrada ainda.</p>;
  }
  const today = todayInBrazil();
  const rows = await Promise.all(
    campaigns.map(async (c) => ({ ...c, progress: await campaignProgress(c) })),
  );

  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {rows.map((c) => {
        const start = c.startsAt.toISOString().slice(0, 10);
        const end = c.endsAt?.toISOString().slice(0, 10);
        const situation = !c.active
          ? "Inativa"
          : start > today
            ? "Agendada"
            : end && end < today
              ? "Encerrada"
              : "No ar";
        return (
          <li key={c.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex flex-1 flex-col">
              <Link href={`/admin/campanhas/${c.id}`} className="font-medium underline">
                {c.title}
              </Link>
              <span className="text-sm text-zinc-500">
                {date.format(c.startsAt)} a {c.endsAt ? date.format(c.endsAt) : "sem data de fim"}
                {c.species && ` · ${speciesLabels[c.species]}`}
              </span>
            </div>
            <span className="text-sm">
              {formatFoodTotal(c.progress.raisedGrams)} de {formatFoodTotal(c.goalGrams)} (
              {c.progress.percent}%)
            </span>
            <span className="text-sm text-zinc-500 sm:w-20">{situation}</span>
          </li>
        );
      })}
    </ul>
  );
}
