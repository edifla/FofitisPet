import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { buildDonationSummary } from "@/lib/checkout";
import { requireUser } from "@/lib/dal";
import { DONATION_NOTICE } from "@/lib/legal";
import { formatBRL } from "@/lib/money";
import { ConfirmDonationForm } from "./confirm-donation-form";
import { containerClasses } from "@/components/ui/layout";

export const metadata: Metadata = {
  title: "Doação ao abrigo",
  robots: { index: false },
};

// Checkout da doação (KAN-31): um passo só, sem endereço e sem frete.
export default function DonationCheckoutPage() {
  return (
    <main className={containerClasses("text")}>
      <h1 className="mb-2 text-2xl font-semibold">Doação ao abrigo</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Os itens vão direto para o estoque do abrigo da FofitisPet assim que o pagamento for
        aprovado. Não há frete nem endereço.
      </p>
      <p className="mb-6 text-sm text-zinc-500">{DONATION_NOTICE}</p>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <DonationSummary />
      </Suspense>
    </main>
  );
}

async function DonationSummary() {
  await requireUser("/checkout/doacao");
  const summary = await buildDonationSummary();

  if (!summary.ok) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p role="alert">
          {summary.reason === "empty-cart"
            ? "Não há itens para doar no carrinho."
            : "Alguns itens da doação passaram do estoque disponível. Ajuste as quantidades."}
        </p>
        <Link
          href={summary.reason === "empty-cart" ? "/produtos?doacao=sim" : "/carrinho"}
          className="font-medium underline"
        >
          {summary.reason === "empty-cart" ? "Ver produtos doáveis" : "Voltar ao carrinho"}
        </Link>
      </div>
    );
  }

  const { lines, unavailable, totalCents } = summary;
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="font-medium">Itens da doação</h2>
          <Link href="/carrinho" className="text-sm underline">
            Alterar
          </Link>
        </div>
        <ul className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
          {lines.map((line) => (
            <li key={line.id} className="flex justify-between gap-4 py-2">
              <span>
                {line.quantity}× {line.productName} · {line.variantName}
                <span className="block text-zinc-500">{formatBRL(line.unitPriceCents)} cada</span>
              </span>
              <span className="font-medium">{formatBRL(line.totalCents)}</span>
            </li>
          ))}
        </ul>
        {unavailable.length > 0 && (
          <p className="text-sm text-zinc-500">
            {unavailable.length} item(ns) indisponível(is) ficam fora da doação.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-1 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800">
        <p className="flex justify-between">
          <span>Frete</span>
          <span>Sem frete</span>
        </p>
        <p className="mt-2 flex justify-between text-lg font-semibold">
          <span>Total da doação</span>
          <span>{formatBRL(totalCents)}</span>
        </p>
      </section>

      <ConfirmDonationForm totalCents={totalCents} />
    </div>
  );
}
