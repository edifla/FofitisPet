import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";
import { Suspense } from "react";
import { BarList } from "@/components/charts/bar-list";
import { TimeChart } from "@/components/charts/time-chart";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { BoxIcon, GiftIcon, HeartIcon, HomeIcon } from "@/components/ui/icons";
import { PageHero } from "@/components/ui/page-hero";
import { formatFoodTotal } from "@/lib/food";
import { formatBRL } from "@/lib/money";
import { getTransparencyReport } from "@/lib/transparency";

export const metadata: Metadata = {
  title: "Transparência",
  description: "Quanto foi doado ao abrigo da FofitisPet, o que foi entregue e como foi usado.",
};

const date = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Sao_Paulo",
});
// Datas sem hora vêm do banco à meia-noite UTC.
const day = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" });
const monthName = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });
const monthLabel = (month: string) =>
  monthName.format(new Date(`${month}-01T00:00:00Z`)).replace(".", "");

const card = "rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-zinc-200/80 dark:ring-zinc-800";

// Página de transparência (KAN-44): o caminho de cada doação, do carrinho até a tigela.
export default function TransparencyPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHero
        tone="donate"
        eyebrow="Transparência"
        title="Veja onde a sua doação está fazendo diferença"
        description="Cada doação feita na loja vira estoque do abrigo. Aqui você acompanha quanto foi doado, o que chegou, o que já foi usado com os animais e o que temos hoje. Os números são atualizados na hora."
      />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-2 pb-14">
        <Suspense fallback={<p className="text-zinc-500">Carregando os números...</p>}>
          <Report />
        </Suspense>
      </div>
    </main>
  );
}

// Um passo do caminho da doação, com o número que mostra que ele aconteceu.
function Step({
  Icon,
  title,
  value,
  detail,
  tone,
}: {
  Icon: ComponentType<{ className?: string }>;
  title: string;
  value: string;
  detail: string;
  tone: "donate" | "brand" | "adopt";
}) {
  const tones = {
    donate: "bg-donate-100 text-donate-800 dark:bg-donate-950 dark:text-donate-200",
    brand: "bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-100",
    adopt: "bg-adopt-100 text-adopt-800 dark:bg-adopt-950 dark:text-adopt-200",
  };
  return (
    <li className={cn(card, "relative flex flex-col gap-2")}>
      <span className={cn("flex size-11 items-center justify-center rounded-2xl", tones[tone])}>
        <Icon className="size-5" />
      </span>
      <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">{title}</h3>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{detail}</p>
    </li>
  );
}

function ItemTable({
  caption,
  rows,
  empty,
}: {
  caption: string;
  rows: { productName: string; variantName: string; quantity: number }[];
  empty: string;
}) {
  return (
    <section className={cn(card, "flex flex-col gap-3")}>
      <h2 className="text-lg font-semibold">{caption}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">{empty}</p>
      ) : (
        <table className="text-left text-sm">
          <thead className="text-xs tracking-wide text-zinc-500 uppercase">
            <tr>
              <th className="py-2 pr-4 font-semibold">Item</th>
              <th className="py-2 text-right font-semibold">Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.productName}-${row.variantName}`}
                className="border-t border-zinc-100 dark:border-zinc-800"
              >
                <td className="py-2.5 pr-4">
                  {row.productName}
                  {row.variantName && <span className="text-zinc-500"> ({row.variantName})</span>}
                </td>
                <td className="py-2.5 text-right font-semibold tabular-nums">{row.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

async function Report() {
  const report = await getTransparencyReport();
  const servedShare =
    report.deliveredFoodGrams > 0
      ? Math.min(100, Math.round((report.consumedFoodGrams / report.deliveredFoodGrams) * 100))
      : 0;

  return (
    <>
      {/* Número principal e o caminho da doação. */}
      <section aria-labelledby="caminho" className="flex flex-col gap-4">
        <div className={cn(card, "flex flex-col gap-1 sm:flex-row sm:items-end sm:gap-6")}>
          <div className="flex flex-col gap-1">
            <h2 id="caminho" className="text-sm font-semibold text-donate-800 dark:text-donate-300">
              Total doado ao abrigo
            </h2>
            <p className="text-5xl font-extrabold tracking-tight">
              {formatBRL(report.raisedCents)}
            </p>
          </div>
          <p className="text-zinc-600 sm:pb-1.5 dark:text-zinc-400">
            {formatBRL(report.recentRaisedCents)} nos últimos {report.recentDays} dias
          </p>
        </div>
        <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Step
            Icon={GiftIcon}
            tone="donate"
            title="1. Você doa"
            value={`${report.donationCount} ${report.donationCount === 1 ? "doação" : "doações"}`}
            detail={`${report.donorCount} ${report.donorCount === 1 ? "doador" : "doadores"} já ajudaram`}
          />
          <Step
            Icon={HomeIcon}
            tone="brand"
            title="2. Chega ao abrigo"
            value={formatFoodTotal(report.deliveredFoodGrams)}
            detail="de ração entregue, sem frete, direto do estoque da loja"
          />
          <Step
            Icon={HeartIcon}
            tone="adopt"
            title="3. Vira cuidado"
            value={formatFoodTotal(report.consumedFoodGrams)}
            detail="de ração já servida aos animais"
          />
        </ol>
        {report.deliveredFoodGrams > 0 && (
          <div className={cn(card, "flex flex-col gap-2 py-5")}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <span className="font-semibold">Ração entregue que já foi servida</span>
              <span className="font-semibold tabular-nums">{servedShare}%</span>
            </div>
            <div
              role="progressbar"
              aria-label="Ração entregue que já foi servida"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={servedShare}
              className="h-3 overflow-hidden rounded-full bg-brand-100 dark:bg-brand-900/50"
            >
              <div
                className="h-full rounded-full bg-brand-600 dark:bg-brand-400"
                style={{ width: `${servedShare}%` }}
              />
            </div>
          </div>
        )}
      </section>

      <section className={cn(card, "flex flex-col gap-4")}>
        <div>
          <h2 className="text-lg font-semibold">Doações entregues por mês</h2>
          <p className="text-sm text-zinc-500">Valor das compras que chegaram ao abrigo.</p>
        </div>
        <TimeChart
          title="Doações entregues por mês"
          kind="columns"
          format="brl"
          tone="donate"
          data={report.monthly.map((m) => ({ label: monthLabel(m.month), value: m.cents }))}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cn(card, "flex flex-col gap-4")}>
          <h2 className="text-lg font-semibold">O que mais chegou</h2>
          <BarList
            title="Itens que mais chegaram ao abrigo"
            tone="donate"
            empty="Nenhuma doação entregue ainda."
            items={report.deliveredItems.slice(0, 6).map((row) => ({
              key: `${row.productName}-${row.variantName}`,
              label: `${row.productName} (${row.variantName})`,
              value: row.quantity,
            }))}
          />
        </section>
        <ItemTable
          caption="O que já foi usado"
          rows={report.consumedItems}
          empty="Nenhum consumo registrado ainda."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cn(card, "flex flex-col gap-3")}>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <BoxIcon className="size-5 text-brand-text" />
            Estoque do abrigo hoje
          </h2>
          {report.shelterStock.length === 0 ? (
            <p className="text-sm text-zinc-500">O estoque do abrigo está vazio. Que tal ajudar?</p>
          ) : (
            <table className="text-left text-sm">
              <caption className="sr-only">Estoque do abrigo hoje</caption>
              <tbody>
                {report.shelterStock.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-zinc-100 first:border-0 dark:border-zinc-800"
                  >
                    <td className="py-2.5 pr-4">
                      {row.productName}
                      <span className="text-zinc-500"> ({row.variantName})</span>
                    </td>
                    <td className="py-2.5 text-right font-semibold tabular-nums">{row.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className={cn(card, "flex flex-col gap-3")}>
          <h2 className="text-lg font-semibold">Últimas doações</h2>
          {report.recentDonations.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhuma doação entregue ainda.</p>
          ) : (
            <ul className="flex flex-col gap-3 text-sm">
              {report.recentDonations.map((donation) => (
                <li key={donation.id} className="flex gap-3">
                  <span
                    aria-hidden
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-donate-100 font-bold text-donate-800 dark:bg-donate-950 dark:text-donate-200"
                  >
                    {donation.donor.charAt(0)}
                  </span>
                  <span className="flex flex-col">
                    <span>
                      <span className="font-semibold">{donation.donor}</span>
                      <span className="text-zinc-500">
                        {" "}
                        · {donation.deliveredAt ? date.format(donation.deliveredAt) : ""}
                      </span>
                    </span>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {donation.items
                        .map((i) => `${i.quantity}× ${i.productName} (${i.variantName})`)
                        .join(", ")}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Fotos das entregas</h2>
        {report.photos.length === 0 ? (
          <p className={cn(card, "text-sm text-zinc-500")}>
            As fotos das entregas aparecem aqui em breve.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {report.photos.map((photo) => (
              <li key={photo.id} className={cn(card, "flex flex-col gap-2 p-3")}>
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900">
                  <Image
                    src={photo.url}
                    alt={photo.caption}
                    fill
                    sizes="(min-width: 1024px) 16rem, (min-width: 768px) 30vw, 45vw"
                    className="object-cover"
                  />
                </div>
                <p className="px-1 text-sm font-medium">{photo.caption}</p>
                <p className="px-1 text-xs text-zinc-500">{day.format(photo.takenOn)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col items-start gap-4 rounded-3xl bg-gradient-to-br from-donate-100 to-brand-50 p-8 sm:flex-row sm:items-center sm:justify-between dark:from-donate-950 dark:to-brand-950">
        <div>
          <h2 className="text-xl font-bold">Quer fazer parte desses números?</h2>
          <p className="text-zinc-700 dark:text-zinc-300">
            Escolha um kit pronto ou um item que está faltando no abrigo.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/doar" className={buttonClasses({ variant: "donate" })}>
            Fazer uma doação
          </Link>
          <Link
            href="/abrigo"
            className={buttonClasses({ variant: "secondary", className: "bg-surface" })}
          >
            Ver o que está faltando
          </Link>
        </div>
      </section>
    </>
  );
}
