import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getVariantStock } from "@/lib/admin/catalog";
import { stockLocationLabels, stockMovementLabels } from "@/lib/labels";
import { AdjustmentForm, RestockForm, ShelterTargetForm } from "./stock-forms";
import { table, tableClasses } from "@/components/ui/table";

export const metadata: Metadata = { title: "Movimentar estoque" };

type Props = PageProps<"/admin/estoque/[variantId]">;

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default function VariantStockPage({ params }: Props) {
  return (
    <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
      <VariantStock params={params} />
    </Suspense>
  );
}

async function VariantStock({ params }: Pick<Props, "params">) {
  const { variantId } = await params;
  const variant = await getVariantStock(variantId);
  if (!variant) notFound();
  const level = (location: "STORE" | "SHELTER") =>
    variant.stockLevels.find((l) => l.location === location)?.quantity ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/admin/estoque" className="text-sm underline">
          ← Estoque
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">
          {variant.product.name} · {variant.name}
        </h1>
        <p className="font-mono text-sm text-zinc-500">{variant.sku}</p>
      </div>

      <dl className="flex gap-8">
        <div>
          <dt className="text-sm text-zinc-500">Na loja</dt>
          <dd className="text-3xl font-semibold tabular-nums">{level("STORE")}</dd>
        </div>
        <div>
          <dt className="text-sm text-zinc-500">No abrigo</dt>
          <dd className="text-3xl font-semibold tabular-nums">{level("SHELTER")}</dd>
        </div>
      </dl>

      <div className="grid gap-8 md:grid-cols-2">
        <RestockForm variantId={variant.id} />
        <AdjustmentForm variantId={variant.id} current={level("STORE")} />
        <ShelterTargetForm
          variantId={variant.id}
          current={
            variant.stockLevels.find((l) => l.location === "SHELTER")?.targetQuantity ?? null
          }
          donationEligible={variant.product.donationEligible}
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Histórico (últimos 50 movimentos)</h2>
        {variant.stockMovements.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhum movimento ainda.</p>
        ) : (
          <div className={table.wrap}>
            <table className={table.table}>
              <thead className={table.head}>
                <tr>
                  <th className={tableClasses("th")}>Quando</th>
                  <th className={tableClasses("th")}>Tipo</th>
                  <th className={tableClasses("th")}>De → Para</th>
                  <th className={tableClasses("th", "text-right")}>Qtd.</th>
                  <th className={tableClasses("th")}>Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {variant.stockMovements.map((movement) => (
                  <tr key={movement.id} className={table.row}>
                    <td className={tableClasses("td", "whitespace-nowrap")}>
                      {dateTime.format(movement.createdAt)}
                    </td>
                    <td className={tableClasses("td")}>{stockMovementLabels[movement.type]}</td>
                    <td className={tableClasses("td", "whitespace-nowrap")}>
                      {movement.fromLocation ? stockLocationLabels[movement.fromLocation] : "—"} →{" "}
                      {movement.toLocation ? stockLocationLabels[movement.toLocation] : "—"}
                    </td>
                    <td className={tableClasses("td", "text-right tabular-nums")}>
                      {movement.quantity}
                    </td>
                    <td className={tableClasses("td", "text-zinc-600 dark:text-zinc-400")}>
                      {[
                        movement.note,
                        movement.order && `pedido #${movement.order.number}`,
                        movement.createdBy?.name,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </td>
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
