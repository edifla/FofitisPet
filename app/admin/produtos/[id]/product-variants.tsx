import Link from "next/link";
import { DeleteButton } from "@/components/admin/delete-button";
import { listProductVariants } from "@/lib/admin/catalog";
import { formatBRL, formatWeight } from "@/lib/money";
import { Notice } from "@/components/ui/notice";
import { deleteVariant } from "../../actions";
import { VariantForm } from "./variant-form";
import { table, tableClasses } from "@/components/ui/table";

export async function ProductVariants({ productId }: { productId: string }) {
  const variants = await listProductVariants(productId);
  const hasActive = variants.some((variant) => variant.active);

  return (
    <section
      id="variacoes"
      aria-labelledby="variacoes-titulo"
      className="flex scroll-mt-24 flex-col gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800"
    >
      {!hasActive && (
        <Notice tone="warning" role="status">
          <strong>Este produto ainda não aparece na loja nem no estoque.</strong>{" "}
          {variants.length === 0
            ? "Cadastre abaixo pelo menos uma variação, com preço e estoque."
            : "Ative pelo menos uma variação."}
        </Notice>
      )}
      <div>
        <h2 id="variacoes-titulo" className="font-medium">
          Variações
        </h2>
        <p className="text-sm text-zinc-500">
          Cada variação tem preço e estoque próprios. O produto só aparece na loja com pelo menos
          uma variação ativa.
        </p>
      </div>
      {variants.length > 0 && (
        <div className={table.wrap}>
          <table className={table.table}>
            <thead className={table.head}>
              <tr>
                <th className={tableClasses("th")}>Variação</th>
                <th className={tableClasses("th")}>SKU</th>
                <th className={tableClasses("th")}>Preço</th>
                <th className={tableClasses("th")}>Peso</th>
                <th className={tableClasses("th")}>
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => (
                <tr key={variant.id} className={table.row}>
                  <td className={tableClasses("td")}>
                    <Link
                      href={`/admin/produtos/${productId}/variacoes/${variant.id}`}
                      className="font-medium underline"
                    >
                      {variant.name}
                    </Link>
                    {!variant.active && <span className="ml-2 text-zinc-500">(inativa)</span>}
                  </td>
                  <td className={tableClasses("td", "font-mono")}>{variant.sku}</td>
                  <td className={tableClasses("td")}>{formatBRL(variant.priceCents)}</td>
                  <td className={tableClasses("td")}>{formatWeight(variant.weightGrams)}</td>
                  <td className={tableClasses("td")}>
                    <DeleteButton
                      action={deleteVariant.bind(null, variant.id)}
                      confirmMessage={`Excluir a variação "${variant.name}"?`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <h3 className="text-sm font-medium">Nova variação</h3>
      <VariantForm productId={productId} />
    </section>
  );
}
