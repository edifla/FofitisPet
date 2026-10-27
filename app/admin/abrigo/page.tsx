import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getShelterPanel } from "@/lib/admin/shelter";
import { ConsumptionForm } from "./consumption-form";
import { table, tableClasses } from "@/components/ui/table";

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
          <div className={table.wrap}>
            <table className={table.table}>
              <thead className={table.head}>
                <tr>
                  <th className={tableClasses("th")}>Item</th>
                  <th className={tableClasses("th", "text-right")}>Saldo</th>
                  <th className={tableClasses("th", "text-right")}>Meta</th>
                  <th className={tableClasses("th", "text-right")}>Usado em 30 dias</th>
                  <th className={tableClasses("th")}>
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {stock.map((row) => (
                  <tr key={row.variantId} className={table.row}>
                    <td className={tableClasses("td")}>{row.label}</td>
                    <td
                      className={`py-2 pr-4 text-right tabular-nums ${row.target !== null && row.quantity < row.target ? "font-semibold text-amber-700 dark:text-amber-400" : ""}`}
                    >
                      {row.quantity}
                    </td>
                    <td className={tableClasses("td", "text-right tabular-nums")}>
                      {row.target ?? "—"}
                    </td>
                    <td className={tableClasses("td", "text-right tabular-nums")}>
                      {row.usedLastMonth}
                    </td>
                    <td className={tableClasses("td")}>
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
          <div className={table.wrap}>
            <table className={table.table}>
              <thead className={table.head}>
                <tr>
                  <th className={tableClasses("th")}>Data</th>
                  <th className={tableClasses("th")}>Item</th>
                  <th className={tableClasses("th", "text-right")}>Qtd.</th>
                  <th className={tableClasses("th")}>Para</th>
                  <th className={tableClasses("th")}>Registrado por</th>
                </tr>
              </thead>
              <tbody>
                {consumptions.map((row) => (
                  <tr key={row.id} className={table.row}>
                    <td className={tableClasses("td", "whitespace-nowrap")}>
                      {date.format(row.consumedAt)}
                    </td>
                    <td className={tableClasses("td")}>
                      {row.variant.product.name} · {row.variant.name}
                      {row.note && <span className="block text-zinc-500">{row.note}</span>}
                    </td>
                    <td className={tableClasses("td", "text-right tabular-nums")}>
                      {row.quantity}
                    </td>
                    <td className={tableClasses("td")}>{row.animal?.name ?? "Abrigo em geral"}</td>
                    <td className={tableClasses("td")}>{row.recordedBy.name}</td>
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
