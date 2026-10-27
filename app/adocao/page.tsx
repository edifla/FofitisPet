import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AnimalCard } from "@/components/adoption/animal-card";
import { ageGroups, searchAnimals } from "@/lib/adoption";
import {
  type AdoptionFilters,
  adoptionHref,
  parseAdoptionParams,
  sizeSlugs,
  temperamentSlugs,
  toAdoptionQuery,
} from "@/lib/adoption-params";
import { speciesSlugs } from "@/lib/catalog-params";
import { animalSizeLabels, speciesLabels, temperamentLabels } from "@/lib/labels";
import { buttonClasses } from "@/components/ui/button";
import { containerClasses, gridClasses } from "@/components/ui/layout";

export const metadata: Metadata = {
  title: "Adoção",
  description: "Conheça os animais do abrigo da FofitisPet que esperam por uma família.",
};

type Props = PageProps<"/adocao">;

// Só espécies que o abrigo costuma receber aparecem no filtro.
const SPECIES_FILTER = ["caes", "gatos"] as const;

// Listagem de animais para adoção (KAN-37).
export default function AdoptionPage({ searchParams }: Props) {
  return (
    <main className={containerClasses("wide", "flex flex-col gap-6")}>
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Adote um amigo</h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Todos os animais do abrigo da FofitisPet são acompanhados por veterinário. Use os filtros
          para encontrar quem combina com a sua casa.
        </p>
      </header>
      <Suspense fallback={<p className="text-zinc-500">Carregando animais...</p>}>
        <AnimalList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function AnimalList({ searchParams }: Pick<Props, "searchParams">) {
  const filters = parseAdoptionParams(await searchParams);
  const { animals, total, pageCount } = await searchAnimals(toAdoptionQuery(filters));
  const hasFilters = Boolean(
    filters.species || filters.size || filters.age || filters.temperament.length,
  );

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      <FilterPanel filters={filters} hasFilters={hasFilters} />
      <div className="flex flex-1 flex-col gap-4">
        <p className="text-sm text-zinc-500" aria-live="polite">
          {total === 1 ? "1 animal" : `${total} animais`}
        </p>
        {animals.length === 0 ? (
          <div className="flex flex-col gap-2 py-8 text-center">
            <p className="font-medium">Nenhum animal com esses filtros.</p>
            {hasFilters && (
              <Link href="/adocao" className="text-sm underline">
                Limpar filtros
              </Link>
            )}
          </div>
        ) : (
          <ul className={gridClasses("cards")}>
            {animals.map((animal) => (
              <li key={animal.id}>
                <AnimalCard animal={animal} />
              </li>
            ))}
          </ul>
        )}

        {pageCount > 1 && (
          <nav aria-label="Páginas" className="flex items-center justify-center gap-4 text-sm">
            {filters.page > 1 && (
              <Link href={adoptionHref(filters, { page: filters.page - 1 })}>← Anterior</Link>
            )}
            <span>
              Página {filters.page} de {pageCount}
            </span>
            {filters.page < pageCount && (
              <Link href={adoptionHref(filters, { page: filters.page + 1 })}>Próxima →</Link>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900";

function FilterPanel({ filters, hasFilters }: { filters: AdoptionFilters; hasFilters: boolean }) {
  return (
    <aside className="md:w-60 md:shrink-0">
      <form action="/adocao" className="flex flex-col gap-6" aria-label="Filtros">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Espécie</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="especie" value="" defaultChecked={!filters.species} />
            Todas
          </label>
          {SPECIES_FILTER.map((slug) => (
            <label key={slug} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="especie"
                value={slug}
                defaultChecked={filters.species === slug}
              />
              {speciesLabels[speciesSlugs[slug]]}
            </label>
          ))}
        </fieldset>

        <div className="flex flex-col gap-1">
          <label htmlFor="porte" className="text-sm font-medium">
            Porte
          </label>
          <select id="porte" name="porte" defaultValue={filters.size ?? ""} className={inputClass}>
            <option value="">Todos</option>
            {Object.entries(sizeSlugs).map(([slug, size]) => (
              <option key={slug} value={slug}>
                {animalSizeLabels[size]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="idade" className="text-sm font-medium">
            Idade
          </label>
          <select id="idade" name="idade" defaultValue={filters.age ?? ""} className={inputClass}>
            <option value="">Todas</option>
            {Object.entries(ageGroups).map(([slug, group]) => (
              <option key={slug} value={slug}>
                {group.label}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Temperamento</legend>
          {Object.entries(temperamentSlugs).map(([slug, value]) => (
            <label key={slug} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="temperamento"
                value={slug}
                defaultChecked={filters.temperament.includes(slug)}
                className="size-4"
              />
              {temperamentLabels[value]}
            </label>
          ))}
        </fieldset>

        <div className="flex items-center gap-4">
          <button type="submit" className={buttonClasses({ size: "sm" })}>
            Aplicar filtros
          </button>
          {hasFilters && (
            <Link href="/adocao" className="text-sm underline">
              Limpar
            </Link>
          )}
        </div>
      </form>
    </aside>
  );
}
