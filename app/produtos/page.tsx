import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import { searchCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Produtos",
  description: "Rações, brinquedos e acessórios para o seu pet.",
};

type Props = PageProps<"/produtos">;

function param(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function CatalogPage({ searchParams }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">Produtos</h1>
      <Suspense fallback={<p className="text-zinc-500">Carregando produtos...</p>}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Catalog({ searchParams }: Pick<Props, "searchParams">) {
  const params = await searchParams;
  const q = param(params.q)?.slice(0, 100) ?? "";
  const page = Math.max(1, Number(param(params.pagina)) || 1);
  const { items, total, pageCount } = await searchCatalog({ q, page });

  const pageHref = (n: number) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (n > 1) next.set("pagina", String(n));
    const query = next.toString();
    return query ? `/produtos?${query}` : "/produtos";
  };

  return (
    <div className="flex flex-col gap-6">
      <form action="/produtos" role="search" className="flex gap-2">
        <label htmlFor="q" className="sr-only">
          Buscar produtos
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Buscar ração, brinquedo, marca..."
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Buscar
        </button>
      </form>

      <p className="text-sm text-zinc-500" aria-live="polite">
        {q ? `${total} resultado(s) para "${q}"` : `${total} produto(s)`}
      </p>

      {items.length === 0 ? (
        <div className="flex flex-col gap-2 py-8 text-center">
          <p className="font-medium">Nenhum produto encontrado.</p>
          {q && (
            <Link href="/produtos" className="text-sm underline">
              Ver todos os produtos
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 && (
        <nav aria-label="Páginas" className="flex items-center justify-center gap-4 text-sm">
          {page > 1 && <Link href={pageHref(page - 1)}>← Anterior</Link>}
          <span>
            Página {page} de {pageCount}
          </span>
          {page < pageCount && <Link href={pageHref(page + 1)}>Próxima →</Link>}
        </nav>
      )}
    </div>
  );
}
