import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CampaignList } from "@/components/campaigns/campaign-list";
import { formatBRL } from "@/lib/money";
import { getShelterNeeds } from "@/lib/shelter";
import { DonateButton } from "./donate-button";
import { cardClasses } from "@/components/ui/card";
import { PageHero } from "@/components/ui/page-hero";
import { containerClasses, gridClasses } from "@/components/ui/layout";

export const metadata: Metadata = {
  title: "Ajude o abrigo",
  description: "Veja o que está faltando no abrigo da FofitisPet e doe direto pela loja.",
};

// Página do abrigo (KAN-33): o que está em falta, para direcionar as doações.
export default function ShelterPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHero
        tone="donate"
        eyebrow="Abrigo FofitisPet"
        title="Ajude o abrigo da FofitisPet"
        description="Você compra o item na loja e ele vai direto para o estoque do abrigo, sem frete. Abaixo estão os itens que mais estão faltando agora."
      />
      <div className={containerClasses("default", "flex flex-col gap-8 pt-4")}>
        <Suspense>
          <CampaignList />
        </Suspense>
        <section className="flex flex-col gap-4" aria-labelledby="necessarios">
          <h2 id="necessarios" className="text-lg font-semibold">
            Itens mais necessários
          </h2>
          <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
            <NeedsList />
          </Suspense>
        </section>
        <p className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/produtos?doacao=sim"
            className="rounded-full bg-surface px-4 py-2 font-medium shadow-sm ring-1 ring-zinc-200 hover:ring-emerald-300 dark:ring-zinc-800"
          >
            Ver todos os produtos que podem ser doados
          </Link>
          <Link
            href="/transparencia"
            className="rounded-full bg-surface px-4 py-2 font-medium shadow-sm ring-1 ring-zinc-200 hover:ring-emerald-300 dark:ring-zinc-800"
          >
            Ver como as doações são usadas
          </Link>
        </p>
      </div>
    </main>
  );
}

async function NeedsList() {
  const needs = await getShelterNeeds();
  if (needs.length === 0) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        No momento o abrigo está abastecido. Obrigado a todos que doaram!
      </p>
    );
  }

  return (
    <ul className={gridClasses("compact")}>
      {needs.map((need) => {
        const percent = Math.round((need.quantity / need.target) * 100);
        return (
          <li key={need.variantId} className={cardClasses()}>
            <div className="flex gap-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
                {need.image && (
                  <Image
                    src={need.image.url}
                    alt={need.image.alt ?? need.productName}
                    fill
                    sizes="4rem"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex flex-col">
                <Link
                  href={`/produtos/${need.productSlug}`}
                  className="font-medium hover:underline"
                >
                  {need.productName}
                </Link>
                <span className="text-sm text-zinc-500">
                  {need.variantName} · {formatBRL(need.priceCents)}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div
                className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
                role="progressbar"
                aria-label={`Saldo de ${need.productName} no abrigo`}
                aria-valuemin={0}
                aria-valuemax={need.target}
                aria-valuenow={need.quantity}
              >
                <div className="h-full bg-emerald-600" style={{ width: `${percent}%` }} />
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {need.quantity} de {need.target} no abrigo · faltam {need.missing}
              </p>
            </div>
            {need.available ? (
              <DonateButton variantId={need.variantId} productName={need.productName} />
            ) : (
              <p className="text-sm text-zinc-500">Esgotado na loja no momento.</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
