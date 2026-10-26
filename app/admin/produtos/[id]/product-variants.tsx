import Link from "next/link";
import { DeleteButton } from "@/components/admin/delete-button";
import { listProductVariants } from "@/lib/admin/catalog";
import { formatBRL, formatWeight } from "@/lib/money";
import { deleteVariant } from "../../actions";
import { VariantForm } from "./variant-form";

export async function ProductVariants({ productId }: { productId: string }) {
  const variants = await listProductVariants(productId);

  return (
    <section className="flex flex-col gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <div>
        <h2 className="font-medium">Variações</h2>
        <p className="text-sm text-zinc-500">
          Cada variação tem preço e estoque próprios. O produto só aparece na loja com pelo menos
          uma variação ativa.
        </p>
      </div>
      {variants.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
              <tr>
                <th className="py-2 pr-4 font-medium">Variação</th>
                <th className="py-2 pr-4 font-medium">SKU</th>
                <th className="py-2 pr-4 font-medium">Preço</th>
                <th className="py-2 pr-4 font-medium">Peso</th>
                <th className="py-2 font-medium">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => (
                <tr key={variant.id} className="border-b border-zinc-100 dark:border-zinc-900">
                  <td className="py-2 pr-4">
                    <Link
                      href={`/admin/produtos/${productId}/variacoes/${variant.id}`}
                      className="font-medium underline"
                    >
                      {variant.name}
                    </Link>
                    {!variant.active && <span className="ml-2 text-zinc-500">(inativa)</span>}
                  </td>
                  <td className="py-2 pr-4 font-mono">{variant.sku}</td>
                  <td className="py-2 pr-4">{formatBRL(variant.priceCents)}</td>
                  <td className="py-2 pr-4">{formatWeight(variant.weightGrams)}</td>
                  <td className="py-2">
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
