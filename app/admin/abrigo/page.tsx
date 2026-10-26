import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getShelterPanel } from "@/lib/admin/shelter";
import { ConsumptionForm } from "./consumption-form";

export const metadata: Metadata = { title: "Abrigo" };

const date = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Sao_Paulo",
});

// Painel de consumo do abrigo (KAN-34): saldo, registro do que foi dado aos animais e histórico.
export default function ShelterAdminPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Abrigo</h1>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <ShelterPanel />
      </Suspense>
    </>
  );
}

async function ShelterPanel() {
  const { stock, consumptions, animals } = await getShelterPanel();
  const available = stock.filter((row) => row.quantity > 0);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
    new Date(),
  );

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Estoque do abrigo</h2>
        {stock.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nada no abrigo ainda. Os itens chegam pelas doações pagas na loja.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
                <tr>
                  <th className="py-2 pr-4 font-medium">Item</th>
                  <th className="py-2 pr-4 text-right font-medium">Saldo</th>
                  <th className="py-2 pr-4 text-right font-medium">Meta</th>
                  <th className="py-2 pr-4 text-right font-medium">Usado em 30 dias</th>
                  <th className="py-2 font-medium">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {stock.map((row) => (
                  <tr key={row.variantId} className="border-b border-zinc-100 dark:border-zinc-900">
                    <td className="py-2 pr-4">{row.label}</td>
                    <td
                      className={`py-2 pr-4 text-right tabular-nums ${row.target !== null && row.quantity < row.target ? "font-semibold text-amber-700 dark:text-amber-400" : ""}`}
                    >
                      {row.quantity}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">{row.target ?? "—"}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{row.usedLastMonth}</td>
                    <td className="py-2">
                      <Link href={`/admin/estoque/${row.variantId}`} className="underline">
                        Estoque
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex max-w-xl flex-col gap-3">
        <h2 className="font-medium">Registrar consumo</h2>
        {available.length === 0 ? (
          <p className="text-sm text-zinc-500">Não há itens com saldo no abrigo para registrar.</p>
        ) : (
          <ConsumptionForm
            items={available.map((row) => ({
              value: row.variantId,
              label: `${row.label} (saldo ${row.quantity})`,
            }))}
            animals={animals.map((animal) => ({ value: animal.id, label: animal.name }))}
            today={today}
          />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Histórico de consumo (últimos 50)</h2>
        {consumptions.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhum consumo registrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
                <tr>
                  <th className="py-2 pr-4 font-medium">Data</th>
                  <th className="py-2 pr-4 font-medium">Item</th>
                  <th className="py-2 pr-4 text-right font-medium">Qtd.</th>
                  <th className="py-2 pr-4 font-medium">Para</th>
                  <th className="py-2 font-medium">Registrado por</th>
                </tr>
              </thead>
              <tbody>
                {consumptions.map((row) => (
                  <tr key={row.id} className="border-b border-zinc-100 dark:border-zinc-900">
                    <td className="py-2 pr-4 whitespace-nowrap">{date.format(row.consumedAt)}</td>
                    <td className="py-2 pr-4">
                      {row.variant.product.name} · {row.variant.name}
                      {row.note && <span className="block text-zinc-500">{row.note}</span>}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">{row.quantity}</td>
                    <td className="py-2 pr-4">{row.animal?.name ?? "Abrigo em geral"}</td>
                    <td className="py-2">{row.recordedBy.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
