import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import { SortSelect } from "@/components/catalog/sort-select";
import { getCatalogFilterOptions, searchCatalog } from "@/lib/catalog";
import {
  type CatalogFilters,
  catalogHref,
  parseCatalogParams,
  speciesSlugs,
  toCatalogQuery,
} from "@/lib/catalog-params";
import { speciesLabels } from "@/lib/labels";

export const metadata: Metadata = {
  title: "Produtos",
  description: "Rações, brinquedos e acessórios para o seu pet.",
};

type Props = PageProps<"/produtos">;

const inputClass =
  "w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900";

export default function CatalogPage({ searchParams }: Props) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">Produtos</h1>
      <Suspense fallback={<p className="text-zinc-500">Carregando produtos...</p>}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Catalog({ searchParams }: Pick<Props, "searchParams">) {
  const filters = parseCatalogParams(await searchParams);
  const [{ items, total, pageCount }, options] = await Promise.all([
    searchCatalog(toCatalogQuery(filters)),
    getCatalogFilterOptions(),
  ]);
  const hasFilters = Boolean(
    filters.species ||
    filters.category ||
    filters.brands.length ||
    filters.minPrice ||
    filters.maxPrice,
  );

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <FilterPanel filters={filters} options={options} hasFilters={hasFilters} />

      <div className="flex flex-1 flex-col gap-6">
        <form action="/produtos" role="search" className="flex gap-2">
          <label htmlFor="q" className="sr-only">
            Buscar produtos
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Buscar ração, brinquedo, marca..."
            className={inputClass}
          />
          <HiddenFilters filters={filters} omit="q" />
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Buscar
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-zinc-500" aria-live="polite">
            {filters.q ? `${total} resultado(s) para "${filters.q}"` : `${total} produto(s)`}
          </p>
          <form action="/produtos" className="flex items-center gap-2">
            <HiddenFilters filters={filters} omit="sort" />
            <SortSelect value={filters.sort} />
          </form>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col gap-2 py-8 text-center">
            <p className="font-medium">Nenhum produto encontrado.</p>
            {(filters.q || hasFilters) && (
              <Link href="/produtos" className="text-sm underline">
                Limpar busca e filtros
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
            {filters.page > 1 && (
              <Link href={catalogHref(filters, { page: filters.page - 1 })}>← Anterior</Link>
            )}
            <span>
              Página {filters.page} de {pageCount}
            </span>
            {filters.page < pageCount && (
              <Link href={catalogHref(filters, { page: filters.page + 1 })}>Próxima →</Link>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}

// Mantém o estado atual ao enviar um dos formulários (busca, filtros ou ordem), menos a parte
// que o próprio formulário edita.
function HiddenFilters({
  filters,
  omit,
}: {
  filters: CatalogFilters;
  omit: "q" | "filters" | "sort";
}) {
  return (
    <>
      {omit !== "q" && filters.q && <input type="hidden" name="q" value={filters.q} />}
      {omit !== "filters" && (
        <>
          {filters.species && <input type="hidden" name="especie" value={filters.species} />}
          {filters.category && <input type="hidden" name="categoria" value={filters.category} />}
          {filters.brands.map((brand) => (
            <input key={brand} type="hidden" name="marca" value={brand} />
          ))}
          {filters.minPrice && <input type="hidden" name="preco_min" value={filters.minPrice} />}
          {filters.maxPrice && <input type="hidden" name="preco_max" value={filters.maxPrice} />}
        </>
      )}
      {omit !== "sort" && filters.sort !== "relevancia" && (
        <input type="hidden" name="ordem" value={filters.sort} />
      )}
    </>
  );
}

function FilterPanel({
  filters,
  options,
  hasFilters,
}: {
  filters: CatalogFilters;
  options: Awaited<ReturnType<typeof getCatalogFilterOptions>>;
  hasFilters: boolean;
}) {
  return (
    <details open className="md:w-60 md:shrink-0">
      <summary className="mb-4 cursor-pointer font-medium md:hidden">Filtros</summary>
      <form action="/produtos" className="flex flex-col gap-6" aria-label="Filtros">
        <HiddenFilters filters={filters} omit="filters" />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Espécie</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="especie" value="" defaultChecked={!filters.species} />
            Todas
          </label>
          {Object.entries(speciesSlugs).map(([slug, species]) => (
            <label key={slug} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="especie"
                value={slug}
                defaultChecked={filters.species === slug}
              />
              {speciesLabels[species]}
            </label>
          ))}
        </fieldset>

        <div className="flex flex-col gap-1">
          <label htmlFor="categoria" className="text-sm font-medium">
            Categoria
          </label>
          <select
            id="categoria"
            name="categoria"
            defaultValue={filters.category ?? ""}
            className={inputClass}
          >
            <option value="">Todas</option>
            {options.categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.depth ? `— ${category.name}` : category.name}
              </option>
            ))}
          </select>
        </div>

        {options.brands.length > 0 && (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">Marca</legend>
            {options.brands.map((brand) => (
              <label key={brand.slug} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="marca"
                  value={brand.slug}
                  defaultChecked={filters.brands.includes(brand.slug)}
                  className="size-4"
                />
                {brand.name}
              </label>
            ))}
          </fieldset>
        )}

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Preço (R$)</legend>
          <div className="flex items-center gap-2">
            <label htmlFor="preco_min" className="sr-only">
              Preço mínimo
            </label>
            <input
              id="preco_min"
              name="preco_min"
              inputMode="decimal"
              placeholder="de"
              defaultValue={filters.minPrice}
              className={inputClass}
            />
            <label htmlFor="preco_max" className="sr-only">
              Preço máximo
            </label>
            <input
              id="preco_max"
              name="preco_max"
              inputMode="decimal"
              placeholder="até"
              defaultValue={filters.maxPrice}
              className={inputClass}
            />
          </div>
        </fieldset>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Aplicar filtros
          </button>
          {hasFilters && (
            <Link
              href={catalogHref(filters, {
                species: null,
                category: null,
                brands: [],
                minPrice: "",
                maxPrice: "",
              })}
              className="text-sm underline"
            >
              Limpar
            </Link>
          )}
        </div>
      </form>
    </details>
  );
}
