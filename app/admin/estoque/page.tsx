import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LOW_STOCK, listStock } from "@/lib/admin/catalog";

export const metadata: Metadata = { title: "Estoque" };

type Props = PageProps<"/admin/estoque">;

export default function StockPage({ searchParams }: Props) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Estoque</h1>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <StockTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function StockTable({ searchParams }: Pick<Props, "searchParams">) {
  const onlyLow = (await searchParams).baixo === "1";
  const rows = await listStock(onlyLow);

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex gap-4 text-sm">
        <Link href="/admin/estoque" className={onlyLow ? "underline" : "font-semibold"}>
          Todas as variações
        </Link>
        <Link href="/admin/estoque?baixo=1" className={onlyLow ? "font-semibold" : "underline"}>
          Estoque baixo (até {LOW_STOCK})
        </Link>
      </nav>
      {rows.length === 0 ? (
        <p className="text-zinc-500">
          {onlyLow ? "Nenhuma variação com estoque baixo." : "Nenhuma variação cadastrada ainda."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
              <tr>
                <th className="py-2 pr-4 font-medium">Produto</th>
                <th className="py-2 pr-4 font-medium">SKU</th>
                <th className="py-2 pr-4 text-right font-medium">Loja</th>
                <th className="py-2 pr-4 text-right font-medium">Abrigo</th>
                <th className="py-2 font-medium">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-zinc-100 dark:border-zinc-900">
                  <td className="py-2 pr-4">
                    {row.product.name} · {row.name}
                    {(!row.active || !row.product.active) && (
                      <span className="ml-2 text-zinc-500">(inativo)</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 font-mono">{row.sku}</td>
                  <td
                    className={`py-2 pr-4 text-right tabular-nums ${row.store <= LOW_STOCK ? "font-semibold text-red-700 dark:text-red-400" : ""}`}
                  >
                    {row.store}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">{row.shelter}</td>
                  <td className="py-2">
                    <Link href={`/admin/estoque/${row.id}`} className="underline">
                      Movimentar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
