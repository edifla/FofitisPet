import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FilterLayout } from "@/components/catalog/filter-layout";
import { ProductCard } from "@/components/catalog/product-card";
import { SortSelect } from "@/components/catalog/sort-select";
import { buttonClasses } from "@/components/ui/button";
import { ChevronIcon, CloseIcon, GiftIcon, SearchIcon } from "@/components/ui/icons";
import { CategoryIcon } from "@/components/catalog/category-icon";
import { FilterSection } from "@/components/catalog/filter-section";
import { PageHero } from "@/components/ui/page-hero";
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
type Options = Awaited<ReturnType<typeof getCatalogFilterOptions>>;

export default function CatalogPage({ searchParams }: Props) {
  return (
    <main className="flex flex-1 flex-col">
      <Suspense
        fallback={
          <>
            <Hero />
            <p className="px-4 text-zinc-500 md:px-8">Carregando produtos...</p>
          </>
        }
      >
        <Catalog searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function Hero({ children }: { children?: React.ReactNode }) {
  return (
    <PageHero
      tone="brand"
      wide
      eyebrow="Loja FofitisPet"
      title="Tudo para o seu pet, com carinho"
      description="Rações, brinquedos e cuidados escolhidos com atenção. Os produtos marcados como doáveis também podem ir direto para o nosso abrigo."
    >
      {children}
    </PageHero>
  );
}

const fieldClass =
  "w-full rounded-full border border-zinc-300 bg-surface px-4 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/30 dark:border-zinc-700";

async function Catalog({ searchParams }: Pick<Props, "searchParams">) {
  const filters = parseCatalogParams(await searchParams);
  const [{ items, total, pageCount }, options] = await Promise.all([
    searchCatalog(toCatalogQuery(filters)),
    getCatalogFilterOptions(),
  ]);
  const active = activeFilters(filters, options);

  return (
    <>
      <FilterLayout
        activeCount={active.length}
        header={
          <Hero>
            <form action="/produtos" role="search" className="relative mt-2 max-w-2xl">
              <label htmlFor="q" className="sr-only">
                Buscar produtos
              </label>
              <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-zinc-500" />
              <input
                id="q"
                name="q"
                type="search"
                defaultValue={filters.q}
                placeholder="Buscar ração, brinquedo, marca..."
                className={`${fieldClass} py-3 pr-28 pl-12 text-base shadow-sm`}
              />
              <HiddenFilters filters={filters} omit="q" />
              <button
                type="submit"
                className={buttonClasses({
                  size: "sm",
                  className: "absolute top-1/2 right-1.5 -translate-y-1/2",
                })}
              >
                Buscar
              </button>
            </form>
            <Link
              href="/compre-para-o-abrigo"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-donate-50 px-3.5 py-1.5 text-sm font-medium text-donate-900 ring-1 ring-donate-200 hover:bg-donate-100 dark:bg-donate-950 dark:text-donate-100 dark:ring-donate-900"
            >
              <GiftIcon className="size-4" />
              Compre para o abrigo: itens em falta e kits prontos →
            </Link>
          </Hero>
        }
        panel={<FilterForm filters={filters} options={options} hasFilters={active.length > 0} />}
        toolbar={
          <>
            <p className="text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
              {filters.q
                ? `${total} resultado(s) para "${filters.q}"`
                : total === 1
                  ? "1 produto"
                  : `${total} produtos`}
            </p>
            <form action="/produtos" className="ml-auto flex items-center gap-2">
              <HiddenFilters filters={filters} omit="sort" />
              <SortSelect value={filters.sort} />
            </form>
          </>
        }
      >
        {active.length > 0 && (
          <ul aria-label="Filtros ativos" className="flex flex-wrap gap-2">
            {active.map((chip) => (
              <li key={chip.key}>
                <Link
                  href={chip.href}
                  className="flex items-center gap-1.5 rounded-full bg-brand-100 py-1.5 pr-2 pl-3 text-sm font-medium text-brand-800 hover:bg-brand-50 dark:bg-brand-800/40 dark:text-brand-100"
                >
                  {chip.label}
                  <CloseIcon className="size-4" />
                  <span className="sr-only">(remover filtro)</span>
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={catalogHref(filters, CLEARED)}
                className="flex items-center px-2 py-1.5 text-sm text-zinc-600 underline dark:text-zinc-400"
              >
                Limpar tudo
              </Link>
            </li>
          </ul>
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-3xl bg-surface px-6 py-12 text-center shadow-sm">
            <p className="text-lg font-semibold">Nada por aqui com essa busca.</p>
            <p className="text-zinc-600 dark:text-zinc-400">
              Tente outras palavras ou tire algum filtro.
            </p>
            {(filters.q || active.length > 0) && (
              <Link
                href="/produtos"
                className={buttonClasses({ variant: "secondary", className: "mt-2" })}
              >
                Limpar busca e filtros
              </Link>
            )}
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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
      </FilterLayout>
    </>
  );
}

const CLEARED: Partial<CatalogFilters> = {
  species: null,
  category: null,
  brands: [],
  minPrice: "",
  maxPrice: "",
  donation: false,
};

// Filtros aplicados, cada um com o link que o remove.
function activeFilters(filters: CatalogFilters, options: Options) {
  const chips: { key: string; label: string; href: string }[] = [];
  if (filters.species) {
    chips.push({
      key: "especie",
      label: speciesLabels[speciesSlugs[filters.species]],
      href: catalogHref(filters, { species: null }),
    });
  }
  if (filters.category) {
    const category = options.categories.find((c) => c.slug === filters.category);
    chips.push({
      key: "categoria",
      label: category?.name ?? filters.category,
      href: catalogHref(filters, { category: null }),
    });
  }
  for (const slug of filters.brands) {
    chips.push({
      key: `marca-${slug}`,
      label: options.brands.find((b) => b.slug === slug)?.name ?? slug,
      href: catalogHref(filters, { brands: filters.brands.filter((b) => b !== slug) }),
    });
  }
  if (filters.minPrice || filters.maxPrice) {
    const label =
      filters.minPrice && filters.maxPrice
        ? `R$ ${filters.minPrice} a R$ ${filters.maxPrice}`
        : filters.minPrice
          ? `A partir de R$ ${filters.minPrice}`
          : `Até R$ ${filters.maxPrice}`;
    chips.push({ key: "preco", label, href: catalogHref(filters, { minPrice: "", maxPrice: "" }) });
  }
  if (filters.donation) {
    chips.push({
      key: "doacao",
      label: "Doáveis ao abrigo",
      href: catalogHref(filters, { donation: false }),
    });
  }
  return chips;
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
          {filters.donation && <input type="hidden" name="doacao" value="sim" />}
        </>
      )}
      {omit !== "sort" && filters.sort !== "relevancia" && (
        <input type="hidden" name="ordem" value={filters.sort} />
      )}
    </>
  );
}

// Opção em forma de "chip": a caixa fica escondida e o rótulo muda de cor quando marcado.
const chip =
  "cursor-pointer rounded-full border border-zinc-300 bg-surface px-3.5 py-1.5 text-sm transition-colors hover:border-brand-400 has-checked:border-brand-700 has-checked:bg-brand-700 has-checked:font-medium has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-brand-600 dark:border-zinc-700 dark:has-checked:border-brand-400 dark:has-checked:bg-brand-400 dark:has-checked:text-zinc-950";

// Seção do painel que abre e fecha.
// Categorias como peças com ícone: "Todas" primeiro e as subcategorias logo depois da mãe, com o
// nome dela em letra pequena.
function categoryTiles(categories: Options["categories"]) {
  let parent = "";
  return [
    { slug: "", name: "Todas", icon: null as string | null, parent: null as string | null },
    ...categories.map((category) => {
      if (category.depth === 0) parent = category.name;
      return {
        slug: category.slug,
        name: category.name,
        icon: category.icon,
        parent: category.depth ? parent : null,
      };
    }),
  ];
}

function FilterForm({
  filters,
  options,
  hasFilters,
}: {
  filters: CatalogFilters;
  options: Options;
  hasFilters: boolean;
}) {
  return (
    <form action="/produtos" className="flex flex-1 flex-col" aria-label="Filtros">
      <HiddenFilters filters={filters} omit="filters" />

      <FilterSection title="Para quem?">
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Espécie</legend>
          <label className={chip}>
            <input
              type="radio"
              name="especie"
              value=""
              defaultChecked={!filters.species}
              className="sr-only"
            />
            Todos
          </label>
          {Object.entries(speciesSlugs).map(([slug, species]) => (
            <label key={slug} className={chip}>
              <input
                type="radio"
                name="especie"
                value={slug}
                defaultChecked={filters.species === slug}
                className="sr-only"
              />
              {speciesLabels[species]}
            </label>
          ))}
        </fieldset>
      </FilterSection>

      <FilterSection title="Categoria">
        <fieldset className="grid grid-cols-3 gap-1.5">
          <legend className="sr-only">Categoria</legend>
          {categoryTiles(options.categories).map((category) => (
            <label
              key={category.slug || "todas"}
              title={category.parent ? `${category.name} (em ${category.parent})` : category.name}
              className="group flex cursor-pointer flex-col items-center gap-1 rounded-xl px-1 py-2 text-center text-[0.7rem] leading-tight font-medium ring-1 ring-zinc-200 transition hover:bg-brand-50 hover:ring-brand-200 has-checked:bg-brand-700 has-checked:text-white has-checked:ring-brand-700 has-focus-visible:ring-2 has-focus-visible:ring-brand-600 dark:ring-zinc-800 dark:hover:bg-brand-900/30 dark:has-checked:bg-brand-400 dark:has-checked:text-brand-950 dark:has-checked:ring-brand-400"
            >
              <input
                type="radio"
                name="categoria"
                value={category.slug}
                defaultChecked={(filters.category ?? "") === category.slug}
                className="sr-only"
              />
              <CategoryIcon
                slug={category.slug}
                icon={category.icon}
                className="size-5 text-brand-700 group-has-checked:text-current dark:text-brand-300"
              />
              {category.name}
            </label>
          ))}
        </fieldset>
      </FilterSection>

      {options.brands.length > 0 && (
        <FilterSection title="Marca" open={filters.brands.length > 0}>
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">Marca</legend>
            {options.brands.map((brand) => (
              <label key={brand.slug} className={chip}>
                <input
                  type="checkbox"
                  name="marca"
                  value={brand.slug}
                  defaultChecked={filters.brands.includes(brand.slug)}
                  className="sr-only"
                />
                {brand.name}
              </label>
            ))}
          </fieldset>
        </FilterSection>
      )}

      <FilterSection title="Preço" open={Boolean(filters.minPrice || filters.maxPrice)}>
        <fieldset className="grid grid-cols-2 gap-2">
          <legend className="sr-only">Faixa de preço</legend>
          {(
            [
              ["preco_min", "De", filters.minPrice],
              ["preco_max", "Até", filters.maxPrice],
            ] as const
          ).map(([name, label, value]) => (
            <label
              key={name}
              className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400"
            >
              {label}
              <span className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-zinc-500">
                  R$
                </span>
                <input
                  name={name}
                  inputMode="decimal"
                  defaultValue={value}
                  placeholder="0"
                  className={`${fieldClass} pl-9 text-sm`}
                />
              </span>
            </label>
          ))}
        </fieldset>
      </FilterSection>

      <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium">
          <span>
            Só doáveis ao abrigo
            <span className="block text-xs font-normal text-zinc-600 dark:text-zinc-400">
              Itens que você pode mandar para o abrigo
            </span>
          </span>
          <input
            type="checkbox"
            name="doacao"
            value="sim"
            defaultChecked={filters.donation}
            className="peer sr-only"
          />
          {/* Interruptor visual; a caixa de seleção real fica escondida acima. */}
          <span
            aria-hidden
            className="relative h-6 w-11 shrink-0 rounded-full bg-zinc-300 transition-colors peer-checked:bg-donate-700 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5 dark:bg-zinc-700"
          />
        </label>
      </div>

      <div className="sticky bottom-0 mt-auto flex items-center gap-3 bg-surface px-5 py-4">
        <button type="submit" className={buttonClasses({ block: true })}>
          Mostrar resultados
        </button>
        {hasFilters && (
          <Link
            href={catalogHref(filters, CLEARED)}
            className="shrink-0 text-sm text-zinc-600 underline dark:text-zinc-400"
          >
            Limpar
          </Link>
        )}
      </div>
    </form>
  );
}
