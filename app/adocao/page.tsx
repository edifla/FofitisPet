import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ageGroups, formatAge, searchAnimals } from "@/lib/adoption";
import {
  type AdoptionFilters,
  adoptionHref,
  parseAdoptionParams,
  sizeSlugs,
  temperamentSlugs,
  toAdoptionQuery,
} from "@/lib/adoption-params";
import { speciesSlugs } from "@/lib/catalog-params";
import {
  animalSexLabels,
  animalSizeLabels,
  animalSpeciesLabels,
  speciesLabels,
  temperamentLabels,
} from "@/lib/labels";

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
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
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
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {animals.map((animal) => (
              <li key={animal.id} className="relative flex flex-col gap-2">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
                  {animal.images[0] ? (
                    <Image
                      src={animal.images[0].url}
                      alt={animal.images[0].alt ?? animal.name}
                      fill
                      sizes="(min-width: 1024px) 18rem, (min-width: 640px) 45vw, 90vw"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-sm text-zinc-400">
                      Foto em breve
                    </span>
                  )}
                  {animal.status === "RESERVED" && (
                    <span className="absolute top-2 left-2 rounded bg-amber-500 px-2 py-0.5 text-xs text-white">
                      Reservado
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-medium">
                    <Link
                      href={`/adocao/${animal.slug}`}
                      className="after:absolute after:inset-0 hover:underline"
                    >
                      {animal.name}
                    </Link>
                  </h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {animalSpeciesLabels[animal.species]} · {animalSexLabels[animal.sex]} ·{" "}
                    {animalSizeLabels[animal.size]} · {formatAge(animal.birthDate)}
                  </p>
                  {animal.temperament.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1">
                      {animal.temperament.slice(0, 3).map((t) => (
                        <li
                          key={t}
                          className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800"
                        >
                          {temperamentLabels[t]}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
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
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
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
