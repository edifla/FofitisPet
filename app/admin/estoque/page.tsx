import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LOW_STOCK, listStock } from "@/lib/admin/catalog";
import { table, tableClasses } from "@/components/ui/table";

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
        <div className={table.wrap}>
          <table className={table.table}>
            <thead className={table.head}>
              <tr>
                <th className={tableClasses("th")}>Produto</th>
                <th className={tableClasses("th")}>SKU</th>
                <th className={tableClasses("th", "text-right")}>Loja</th>
                <th className={tableClasses("th", "text-right")}>Abrigo</th>
                <th className={tableClasses("th")}>
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={table.row}>
                  <td className={tableClasses("td")}>
                    {row.product.name} · {row.name}
                    {(!row.active || !row.product.active) && (
                      <span className="ml-2 text-zinc-500">(inativo)</span>
                    )}
                  </td>
                  <td className={tableClasses("td", "font-mono")}>{row.sku}</td>
                  <td
                    className={`py-2 pr-4 text-right tabular-nums ${row.store <= LOW_STOCK ? "font-semibold text-red-700 dark:text-red-400" : ""}`}
                  >
                    {row.store}
                  </td>
                  <td className={tableClasses("td", "text-right tabular-nums")}>
                    {row.shelter}
                    {row.shelterTarget !== null && (
                      <span
                        className={
                          row.shelter < row.shelterTarget
                            ? "text-amber-700 dark:text-amber-400"
                            : "text-zinc-500"
                        }
                      >
                        {" "}
                        / meta {row.shelterTarget}
                      </span>
                    )}
                  </td>
                  <td className={tableClasses("td")}>
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
