import type { Metadata } from "next";
import { Suspense } from "react";
import { todayInBrazil } from "@/lib/campaigns";
import { requireAdmin } from "@/lib/dal";
import { CampaignForm } from "../campaign-form";

export const metadata: Metadata = { title: "Nova campanha" };

export default function NewCampaignPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Nova campanha</h1>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <NewCampaignForm />
      </Suspense>
    </>
  );
}

async function NewCampaignForm() {
  await requireAdmin();
  return <CampaignForm today={todayInBrazil()} />;
}
