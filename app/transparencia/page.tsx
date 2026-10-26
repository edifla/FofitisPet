import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
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

// Página de transparência (KAN-44).
export default function TransparencyPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Transparência</h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Cada doação feita na loja vira estoque do abrigo. Aqui você vê quanto foi doado, o que
          chegou, o que já foi usado com os animais e o que temos hoje. Os números são atualizados
          na hora.
        </p>
      </header>
      <Suspense fallback={<p className="text-zinc-500">Carregando os números...</p>}>
        <Report />
      </Suspense>
      <p className="flex flex-wrap gap-4 text-sm">
        <Link href="/doar" className="underline">
          Fazer uma doação
        </Link>
        <Link href="/abrigo" className="underline">
          Ver o que está faltando
        </Link>
      </p>
    </main>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd className="text-2xl font-semibold">{value}</dd>
      {detail && <dd className="text-sm text-zinc-500">{detail}</dd>}
    </div>
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
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{caption}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">{empty}</p>
      ) : (
        <table className="text-left text-sm">
          <thead className="text-zinc-500">
            <tr>
              <th className="py-1 pr-4 font-normal">Item</th>
              <th className="py-1 text-right font-normal">Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.productName}-${row.variantName}`}
                className="border-t border-zinc-200 dark:border-zinc-800"
              >
                <td className="py-1 pr-4">
                  {row.productName}
                  {row.variantName && <span className="text-zinc-500"> ({row.variantName})</span>}
                </td>
                <td className="py-1 text-right">{row.quantity}</td>
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

  return (
    <div className="flex flex-col gap-10">
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Total doado"
          value={formatBRL(report.raisedCents)}
          detail={`${formatBRL(report.recentRaisedCents)} nos últimos ${report.recentDays} dias`}
        />
        <Stat
          label="Doações entregues"
          value={String(report.donationCount)}
          detail={`${report.donorCount} ${report.donorCount === 1 ? "doador" : "doadores"}`}
        />
        <Stat label="Ração entregue" value={formatFoodTotal(report.deliveredFoodGrams)} />
        <Stat label="Ração já servida" value={formatFoodTotal(report.consumedFoodGrams)} />
      </dl>

      <div className="grid gap-8 md:grid-cols-2">
        <ItemTable
          caption="O que chegou ao abrigo"
          rows={report.deliveredItems}
          empty="Nenhuma doação entregue ainda."
        />
        <ItemTable
          caption="O que já foi usado"
          rows={report.consumedItems}
          empty="Nenhum consumo registrado ainda."
        />
      </div>

      <ItemTable
        caption="Estoque do abrigo hoje"
        rows={report.shelterStock}
        empty="O estoque do abrigo está vazio. Que tal ajudar?"
      />

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Últimas doações</h2>
        {report.recentDonations.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhuma doação entregue ainda.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
            {report.recentDonations.map((donation) => (
              <li key={donation.id} className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
                <span className="text-zinc-500 sm:w-24">
                  {donation.deliveredAt ? date.format(donation.deliveredAt) : ""}
                </span>
                <span className="font-medium sm:w-40">{donation.donor}</span>
                <span className="flex-1">
                  {donation.items
                    .map((i) => `${i.quantity}× ${i.productName} (${i.variantName})`)
                    .join(", ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Fotos</h2>
        {report.photos.length === 0 ? (
          <p className="text-sm text-zinc-500">As fotos das entregas aparecem aqui em breve.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {report.photos.map((photo) => (
              <li key={photo.id} className="flex flex-col gap-1">
                <div className="relative aspect-square overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-900">
                  <Image
                    src={photo.url}
                    alt={photo.caption}
                    fill
                    sizes="(min-width: 768px) 18rem, 45vw"
                    className="object-cover"
                  />
                </div>
                <p className="text-sm">{photo.caption}</p>
                <p className="text-xs text-zinc-500">{day.format(photo.takenOn)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
