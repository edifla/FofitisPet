import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DeleteButton } from "@/components/admin/delete-button";
import { campaignProgress, todayInBrazil } from "@/lib/campaigns";
import { requireAdmin } from "@/lib/dal";
import { formatFoodTotal } from "@/lib/food";
import { gramsToInput } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { deleteCampaign } from "../actions";
import { CampaignForm } from "../campaign-form";

export const metadata: Metadata = { title: "Editar campanha" };

type Props = PageProps<"/admin/campanhas/[id]">;

export default function EditCampaignPage({ params }: Props) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Editar campanha</h1>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <EditCampaign params={params} />
      </Suspense>
    </>
  );
}

const toDateInput = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : "");

async function EditCampaign({ params }: Pick<Props, "params">) {
  await requireAdmin();
  const campaign = await prisma.campaign.findUnique({ where: { id: (await params).id } });
  if (!campaign) notFound();
  const progress = await campaignProgress(campaign);

  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm">
        <Link href="/admin/campanhas" className="underline">
          ← Campanhas
        </Link>
      </p>
      <p className="text-sm">
        Arrecadado até agora: <strong>{formatFoodTotal(progress.raisedGrams)}</strong> de{" "}
        {formatFoodTotal(campaign.goalGrams)} ({progress.percent}%) em {progress.donations}{" "}
        doação(ões).
      </p>
      <CampaignForm
        today={todayInBrazil()}
        campaign={{
          id: campaign.id,
          title: campaign.title,
          slug: campaign.slug,
          description: campaign.description,
          goal: gramsToInput(campaign.goalGrams),
          species: campaign.species ?? "",
          startsAt: toDateInput(campaign.startsAt),
          endsAt: toDateInput(campaign.endsAt),
          active: campaign.active,
        }}
      />
      <DeleteButton
        action={deleteCampaign.bind(null, campaign.id)}
        confirmMessage={`Excluir a campanha "${campaign.title}"? As doações não são afetadas.`}
        label="Excluir campanha"
      />
    </div>
  );
}
