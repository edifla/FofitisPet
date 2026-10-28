import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CampaignList } from "@/components/campaigns/campaign-list";
import { ImpactLink } from "@/components/donation/impact-link";
import { cardClasses } from "@/components/ui/card";
import { containerClasses, gridClasses } from "@/components/ui/layout";
import { PageHero } from "@/components/ui/page-hero";
import { getActiveKits } from "@/lib/kits";
import { DONATION_NOTICE } from "@/lib/legal";
import { formatBRL } from "@/lib/money";
import { getShelterNeeds } from "@/lib/shelter";
import { DonateButton } from "./donate-button";
import { DonateKitButton } from "./donate-kit-button";

export const metadata: Metadata = {
  title: "Compre para o abrigo",
  description:
    "Compre na loja da FofitisPet itens e kits que vão direto para o abrigo, sem frete: o que está faltando agora e as campanhas em andamento.",
};

// Loja > Compre para o abrigo (KAN-30 a 33, KAN-43): as compras feitas para o abrigo ficam dentro
// da loja. O item sai do estoque da loja direto para o abrigo, sem frete. Outras formas de ajudar
// (itens trazidos pela pessoa, voluntariado) ficam na aba Doar.
export default function BuyForShelterPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHero
        tone="donate"
        eyebrow="Loja"
        title="Compre para o abrigo"
        description="Você compra aqui na loja e o item vai direto para o estoque do abrigo, sem frete. Paga como numa compra comum e recebe o comprovante da doação por e-mail."
      >
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">{DONATION_NOTICE}</p>
      </PageHero>
      <div className={containerClasses("default", "flex flex-col gap-10 pt-4")}>
        <ImpactLink />
        <Suspense>
          <CampaignList heading="Campanhas em andamento" />
        </Suspense>

        <section className="flex flex-col gap-4" aria-labelledby="necessarios">
          <h2 id="necessarios" className="text-lg font-semibold">
            O que está faltando agora
          </h2>
          <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
            <NeedsList />
          </Suspense>
        </section>

        <section className="flex flex-col gap-4" aria-labelledby="kits">
          <h2 id="kits" className="text-lg font-semibold">
            Kits prontos
          </h2>
          <Suspense fallback={<p className="text-zinc-500">Carregando kits...</p>}>
            <KitList />
          </Suspense>
        </section>

        <p className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/produtos?doacao=sim"
            className="rounded-full bg-surface px-4 py-2 font-medium shadow-sm ring-1 ring-zinc-200 hover:ring-donate-300 dark:ring-zinc-800"
          >
            Ver todos os produtos que podem ser doados
          </Link>
          <Link
            href="/transparencia"
            className="rounded-full bg-surface px-4 py-2 font-medium shadow-sm ring-1 ring-zinc-200 hover:ring-donate-300 dark:ring-zinc-800"
          >
            Ver como as doações são usadas
          </Link>
          <Link
            href="/doar"
            className="rounded-full bg-surface px-4 py-2 font-medium shadow-sm ring-1 ring-zinc-200 hover:ring-donate-300 dark:ring-zinc-800"
          >
            Outras formas de ajudar
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
                <div className="h-full bg-donate-600" style={{ width: `${percent}%` }} />
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

async function KitList() {
  const kits = await getActiveKits();
  if (kits.length === 0) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        Nenhum kit disponível agora. Você ainda pode doar produtos avulsos.
      </p>
    );
  }

  return (
    <ul className={gridClasses("compact")}>
      {kits.map((kit) => (
        <li key={kit.id} className={cardClasses()}>
          <div className="relative aspect-video overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
            {kit.image && (
              <Image
                src={kit.image.url}
                alt={kit.image.alt ?? kit.name}
                fill
                sizes="(min-width: 1024px) 18rem, (min-width: 640px) 45vw, 90vw"
                className="object-cover"
              />
            )}
          </div>
          <div>
            <h3 className="font-semibold">{kit.name}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{kit.description}</p>
          </div>
          <ul className="text-sm">
            {kit.items.map((item) => (
              <li key={item.id}>
                {item.quantity}× {item.variant.product.name} ({item.variant.name})
              </li>
            ))}
          </ul>
          <p className="mt-auto text-lg font-semibold">{formatBRL(kit.totalCents)}</p>
          {kit.available ? (
            <DonateKitButton kitId={kit.id} kitName={kit.name} />
          ) : (
            <p className="text-sm text-zinc-500">Algum item está esgotado no momento.</p>
          )}
        </li>
      ))}
    </ul>
  );
}
