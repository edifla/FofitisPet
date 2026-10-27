import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AnimalCard } from "@/components/adoption/animal-card";
import { HowItWorks } from "@/components/adoption/how-it-works";
import { PawIcon } from "@/components/brand/logo";
import { buttonClasses } from "@/components/ui/button";
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

export const metadata: Metadata = {
  title: "Adoção",
  description: "Conheça os animais do abrigo da FofitisPet que esperam por uma família.",
};

type Props = PageProps<"/adocao">;

// Só espécies que o abrigo costuma receber aparecem no filtro.
const SPECIES_FILTER = ["caes", "gatos"] as const;

// Adoção (KAN-37), com identidade própria: azul, acolhedora e centrada nos animais.
export default function AdoptionPage({ searchParams }: Props) {
  return (
    <main className="flex flex-1 flex-col">
      <section className="relative overflow-hidden bg-gradient-to-b from-adopt-100 to-adopt-50 dark:from-adopt-950 dark:to-zinc-950">
        <PawIcon className="pointer-events-none absolute -top-6 -right-6 size-40 rotate-12 text-adopt-200 dark:text-adopt-900" />
        <PawIcon className="pointer-events-none absolute bottom-4 left-[8%] size-16 -rotate-12 text-adopt-200 dark:text-adopt-900" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-12 sm:py-16">
          <p className="text-sm font-semibold tracking-wide text-adopt-800 uppercase dark:text-adopt-300">
            Adoção responsável
          </p>
          <h1 className="max-w-2xl text-4xl leading-tight font-extrabold text-adopt-950 sm:text-5xl dark:text-white">
            Cada um tem uma história. Falta a sua.
          </h1>
          <p className="max-w-xl text-lg text-zinc-700 dark:text-zinc-300">
            Os animais do abrigo da FofitisPet foram resgatados, cuidados por veterinário e estão
            prontos para uma família. Conheça cada um com calma: a gente ajuda a encontrar quem
            combina com a sua casa.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#animais" className={buttonClasses({ size: "lg" })}>
              Conhecer os animais
            </a>
            <a
              href="#como-funciona"
              className={buttonClasses({ variant: "secondary", size: "lg" })}
            >
              Como funciona
            </a>
          </div>
        </div>
      </section>

      <section
        id="animais"
        className="mx-auto flex w-full max-w-6xl scroll-mt-4 flex-col gap-6 px-4 py-10"
      >
        <Suspense fallback={<p className="text-zinc-500">Procurando os animais...</p>}>
          <AnimalList searchParams={searchParams} />
        </Suspense>
      </section>

      <section
        id="como-funciona"
        className="scroll-mt-4 border-t border-adopt-100 bg-adopt-50 dark:border-adopt-900 dark:bg-adopt-950/40"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12">
          <h2 className="text-3xl font-extrabold text-adopt-950 dark:text-white">
            Como funciona a adoção
          </h2>
          <HowItWorks />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            A adoção é gratuita. Antes de enviar o interesse, leia o{" "}
            <Link href="/termo-de-adocao" className="text-brand-text underline">
              termo de adoção responsável
            </Link>
            .
          </p>
        </div>
      </section>
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
    <>
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-extrabold text-adopt-950 dark:text-white">
          Esperando por você
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400" aria-live="polite">
          {total === 0
            ? "Ninguém com esse perfil agora."
            : total === 1
              ? "1 amigo esperando por uma família."
              : `${total} amigos esperando por uma família.`}
        </p>
      </div>

      <Filters filters={filters} hasFilters={hasFilters} />

      {animals.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-adopt-50 px-6 py-12 text-center dark:bg-adopt-950/40">
          <PawIcon className="size-10 text-adopt-400" />
          <p className="text-lg font-semibold">Ninguém com esse perfil por aqui agora.</p>
          <p className="max-w-md text-zinc-600 dark:text-zinc-400">
            Tente tirar algum filtro: às vezes o amigo certo não é bem o que a gente imaginava.
          </p>
          {hasFilters && (
            <Link href="/adocao#animais" className={buttonClasses({ variant: "secondary" })}>
              Ver todos
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
    </>
  );
}

// Opção em forma de "chip": a caixa fica escondida e o rótulo muda de cor quando marcado.
const chip =
  "cursor-pointer rounded-full border border-adopt-200 bg-white px-4 py-2 text-sm font-medium text-adopt-900 transition-colors hover:border-adopt-400 has-checked:border-adopt-700 has-checked:bg-adopt-700 has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-adopt-600 dark:border-adopt-900 dark:bg-zinc-900 dark:text-adopt-100 dark:has-checked:border-adopt-400 dark:has-checked:bg-adopt-400 dark:has-checked:text-adopt-950";

const selectClass =
  "rounded-full border border-adopt-200 bg-white px-4 py-2 text-sm text-adopt-900 outline-none focus:border-adopt-600 focus:ring-2 focus:ring-adopt-600/30 dark:border-adopt-900 dark:bg-zinc-900 dark:text-adopt-100";

function Filters({ filters, hasFilters }: { filters: AdoptionFilters; hasFilters: boolean }) {
  return (
    <form
      action="/adocao#animais"
      aria-label="Filtros"
      className="flex flex-col gap-4 rounded-3xl bg-adopt-50/70 p-4 sm:p-5 dark:bg-adopt-950/40"
    >
      <div className="flex flex-wrap items-center gap-2">
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
          {SPECIES_FILTER.map((slug) => (
            <label key={slug} className={chip}>
              <input
                type="radio"
                name="especie"
                value={slug}
                defaultChecked={filters.species === slug}
                className="sr-only"
              />
              {speciesLabels[speciesSlugs[slug]]}
            </label>
          ))}
        </fieldset>
        <label className="sr-only" htmlFor="porte">
          Porte
        </label>
        <select id="porte" name="porte" defaultValue={filters.size ?? ""} className={selectClass}>
          <option value="">Qualquer porte</option>
          {Object.entries(sizeSlugs).map(([slug, size]) => (
            <option key={slug} value={slug}>
              Porte {animalSizeLabels[size].toLowerCase()}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="idade">
          Idade
        </label>
        <select id="idade" name="idade" defaultValue={filters.age ?? ""} className={selectClass}>
          <option value="">Qualquer idade</option>
          {Object.entries(ageGroups).map(([slug, group]) => (
            <option key={slug} value={slug}>
              {group.label}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold text-adopt-900 dark:text-adopt-100">
          Que jeito combina com a sua casa?
        </legend>
        <div className="flex flex-wrap gap-2">
          {Object.entries(temperamentSlugs).map(([slug, value]) => (
            <label key={slug} className={chip}>
              <input
                type="checkbox"
                name="temperamento"
                value={slug}
                defaultChecked={filters.temperament.includes(slug)}
                className="sr-only"
              />
              {temperamentLabels[value]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex items-center gap-4">
        <button type="submit" className={buttonClasses()}>
          Mostrar
        </button>
        {hasFilters && (
          <Link href="/adocao#animais" className="text-sm text-brand-text underline">
            Limpar filtros
          </Link>
        )}
      </div>
    </form>
  );
}
