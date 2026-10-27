import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { DeleteButton } from "@/components/admin/delete-button";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { PencilIcon, PlusIcon, SearchIcon } from "@/components/ui/icons";
import { Notice } from "@/components/ui/notice";
import { table, tableClasses } from "@/components/ui/table";
import { listProducts } from "@/lib/admin/catalog";
import { formatBRL } from "@/lib/money";
import { deleteProduct } from "../actions";

export const metadata: Metadata = { title: "Produtos" };

type Props = PageProps<"/admin/produtos">;

export default function ProductsPage({ searchParams }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="text-sm text-zinc-500">
            Cadastre, edite e exclua os produtos da loja. Preço e estoque ficam nas variações.
          </p>
        </div>
        <Link href="/admin/produtos/novo" className={buttonClasses()}>
          <PlusIcon className="size-4" />
          Novo produto
        </Link>
      </div>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <ProductTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const pill = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";

function priceRange(min: number | null, max: number | null) {
  if (min === null || max === null) return "—";
  return min === max ? formatBRL(min) : `${formatBRL(min)} – ${formatBRL(max)}`;
}

async function ProductTable({ searchParams }: Pick<Props, "searchParams">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const products = await listProducts(q);

  return (
    <>
      {params.excluido === "1" && (
        <Notice tone="success" role="status">
          Produto excluído. Se ele já tinha vendas, os pedidos antigos continuam com o histórico.
        </Notice>
      )}
      <form role="search" className="relative max-w-md">
        <label htmlFor="busca-produto" className="sr-only">
          Buscar produto pelo nome
        </label>
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-500" />
        <input
          id="busca-produto"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Buscar pelo nome..."
          className="w-full rounded-xl border border-zinc-300 bg-surface py-2.5 pr-3 pl-10 text-sm shadow-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/30 dark:border-zinc-700"
        />
      </form>

      {products.length === 0 ? (
        <div className="rounded-2xl bg-surface px-6 py-12 text-center shadow-sm ring-1 ring-zinc-200/80 dark:ring-zinc-800">
          <p className="font-semibold">
            {q ? `Nenhum produto com "${q}".` : "Nenhum produto cadastrado ainda."}
          </p>
        </div>
      ) : (
        <div className={table.wrap}>
          <table className={table.table}>
            <caption className="sr-only">Produtos cadastrados</caption>
            <thead className={table.head}>
              <tr>
                <th className={table.th}>Produto</th>
                <th className={table.th}>Categoria</th>
                <th className={tableClasses("th", "text-right")}>Preço</th>
                <th className={tableClasses("th", "text-right")}>Estoque na loja</th>
                <th className={table.th}>Situação</th>
                <th className={tableClasses("th", "text-right")}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className={table.row}>
                  <td className={table.td}>
                    <div className="flex items-center gap-3">
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200/70 dark:bg-zinc-800 dark:ring-zinc-700">
                        {product.image && (
                          <Image
                            src={product.image}
                            alt=""
                            fill
                            sizes="2.75rem"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/produtos/${product.id}`}
                          className="font-semibold hover:text-brand-text hover:underline"
                        >
                          {product.name}
                        </Link>
                        <p className="truncate text-xs text-zinc-500">
                          {product.brand?.name ?? "Sem marca"} · /{product.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className={tableClasses("td", "text-zinc-600 dark:text-zinc-400")}>
                    {product.category.name}
                  </td>
                  <td className={tableClasses("td", "text-right whitespace-nowrap tabular-nums")}>
                    {priceRange(product.minPriceCents, product.maxPriceCents)}
                  </td>
                  <td className={tableClasses("td", "text-right tabular-nums")}>
                    <span
                      className={cn(
                        product.activeVariants > 0 &&
                          product.storeStock === 0 &&
                          "font-semibold text-red-700 dark:text-red-400",
                      )}
                    >
                      {product.activeVariants === 0 ? "—" : product.storeStock}
                    </span>
                    <span className="block text-xs text-zinc-500">
                      {product.activeVariants === 1
                        ? "1 variação"
                        : `${product.activeVariants} variações`}
                    </span>
                  </td>
                  <td className={table.td}>
                    <div className="flex flex-wrap gap-1.5">
                      {product.activeVariants === 0 ? (
                        <span
                          className={cn(
                            pill,
                            "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
                          )}
                        >
                          Fora da loja: falta uma variação
                        </span>
                      ) : product.active ? (
                        <span
                          className={cn(
                            pill,
                            "bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-100",
                          )}
                        >
                          Na loja
                        </span>
                      ) : (
                        <span
                          className={cn(
                            pill,
                            "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
                          )}
                        >
                          Inativo
                        </span>
                      )}
                      {product.donationEligible && (
                        <span
                          className={cn(
                            pill,
                            "bg-donate-100 text-donate-800 dark:bg-donate-950 dark:text-donate-200",
                          )}
                        >
                          Doável
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={tableClasses("td", "text-right")}>
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/produtos/${product.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-brand-text hover:bg-brand-50 dark:hover:bg-brand-900/40"
                      >
                        <PencilIcon className="size-4" />
                        Editar<span className="sr-only"> {product.name}</span>
                      </Link>
                      <DeleteButton
                        appearance="button"
                        action={deleteProduct.bind(null, product.id)}
                        confirmMessage={`Excluir o produto "${product.name}"? Se ele já tiver vendas, sai da loja e do admin, mas os pedidos antigos continuam com o histórico.`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
