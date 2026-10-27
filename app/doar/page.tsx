import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CampaignList } from "@/components/campaigns/campaign-list";
import { getActiveKits } from "@/lib/kits";
import { DONATION_NOTICE } from "@/lib/legal";
import { formatBRL } from "@/lib/money";
import { DonateKitButton } from "./donate-kit-button";
import { cardClasses } from "@/components/ui/card";
import { containerClasses, gridClasses } from "@/components/ui/layout";

export const metadata: Metadata = {
  title: "Doar",
  description: "Doe kits prontos de ração e cuidados para o abrigo da FofitisPet.",
};

// Aba "Doar" (KAN-43): kits prontos que usam o fluxo de compra para o abrigo (KAN-30 a 32).
export default function DonatePage() {
  return (
    <main className={containerClasses("default", "flex flex-col gap-8")}>
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Doe para o abrigo</h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Escolha um kit pronto: os itens saem do estoque da loja direto para o abrigo, sem frete.
          Você paga como numa compra comum e recebe o comprovante da doação por e-mail.
        </p>
        <p className="max-w-2xl text-sm text-zinc-500">{DONATION_NOTICE}</p>
      </header>

      <Suspense>
        <CampaignList heading="Campanhas em andamento" />
      </Suspense>

      <section className="flex flex-col gap-4" aria-labelledby="kits">
        <h2 id="kits" className="text-lg font-semibold">
          Kits prontos
        </h2>
        <Suspense fallback={<p className="text-zinc-500">Carregando kits...</p>}>
          <KitList />
        </Suspense>
      </section>

      <p className="flex flex-wrap gap-4 text-sm">
        <Link href="/abrigo" className="underline">
          Ver o que está faltando no abrigo
        </Link>
        <Link href="/produtos?doacao=sim" className="underline">
          Escolher produtos avulsos para doar
        </Link>
        <Link href="/transparencia" className="underline">
          Ver como as doações são usadas
        </Link>
      </p>
    </main>
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
          <div className="relative aspect-video overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-900">
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
