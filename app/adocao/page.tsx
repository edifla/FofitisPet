import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AnimalCard } from "@/components/adoption/animal-card";
import { HowItWorks } from "@/components/adoption/how-it-works";
import { FilterLayout } from "@/components/catalog/filter-layout";
import { FilterSection } from "@/components/catalog/filter-section";
import { PawIcon } from "@/components/brand/logo";
import { buttonClasses } from "@/components/ui/button";
import { CloseIcon } from "@/components/ui/icons";
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

// Adoção (KAN-37), com identidade própria: azul, acolhedora e centrada nos animais. Os filtros
// ficam numa barra lateral fixa, no mesmo padrão da loja.
export default function AdoptionPage({ searchParams }: Props) {
  return (
    <main className="flex flex-1 flex-col">
      <Suspense
        fallback={
          <>
            <Hero />
            <p className="px-4 text-zinc-500 md:px-8">Procurando os animais...</p>
          </>
        }
      >
        <AnimalList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-adopt-100 to-adopt-50 dark:from-adopt-950 dark:to-transparent">
      <PawIcon className="pointer-events-none absolute -top-6 -right-6 size-40 rotate-12 text-adopt-200 dark:text-adopt-900" />
      <PawIcon className="pointer-events-none absolute bottom-4 left-[55%] hidden size-16 -rotate-12 text-adopt-200 md:block dark:text-adopt-900" />
      <div className="relative flex w-full flex-col gap-4 px-4 pt-10 pb-8 md:px-8">
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
        <div>
          <a href="#como-funciona" className={buttonClasses({ variant: "secondary" })}>
            Como funciona a adoção
          </a>
        </div>
      </div>
    </section>
  );
}

async function AnimalList({ searchParams }: Pick<Props, "searchParams">) {
  const filters = parseAdoptionParams(await searchParams);
  const { animals, total, pageCount } = await searchAnimals(toAdoptionQuery(filters));
  const active = activeFilters(filters);

  return (
    <FilterLayout
      tone="adopt"
      activeCount={active.length}
      header={<Hero />}
      panel={<Filters filters={filters} hasFilters={active.length > 0} />}
      toolbar={
        <div className="flex flex-col">
          <h2 id="animais" className="text-2xl font-extrabold text-adopt-950 dark:text-white">
            Esperando por você
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
            {total === 0
              ? "Ninguém com esse perfil agora."
              : total === 1
                ? "1 amigo esperando por uma família."
                : `${total} amigos esperando por uma família.`}
          </p>
        </div>
      }
    >
      {active.length > 0 && (
        <ul aria-label="Filtros ativos" className="flex flex-wrap gap-2">
          {active.map((chip) => (
            <li key={chip.key}>
              <Link
                href={chip.href}
                className="flex items-center gap-1.5 rounded-full bg-adopt-100 py-1.5 pr-2 pl-3 text-sm font-medium text-adopt-900 hover:bg-adopt-50 dark:bg-adopt-900/50 dark:text-adopt-100"
              >
                {chip.label}
                <CloseIcon className="size-4" />
                <span className="sr-only">(remover filtro)</span>
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/adocao"
              className="flex items-center px-2 py-1.5 text-sm text-zinc-600 underline dark:text-zinc-400"
            >
              Limpar tudo
            </Link>
          </li>
        </ul>
      )}

      {animals.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-adopt-50 px-6 py-12 text-center dark:bg-adopt-950/40">
          <PawIcon className="size-10 text-adopt-400" />
          <p className="text-lg font-semibold">Ninguém com esse perfil por aqui agora.</p>
          <p className="max-w-md text-zinc-600 dark:text-zinc-400">
            Tente tirar algum filtro: às vezes o amigo certo não é bem o que a gente imaginava.
          </p>
          {active.length > 0 && (
            <Link href="/adocao" className={buttonClasses({ variant: "secondary" })}>
              Ver todos
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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

      <section
        id="como-funciona"
        className="mt-6 flex scroll-mt-24 flex-col gap-6 rounded-3xl bg-adopt-50 p-6 sm:p-8 dark:bg-adopt-950/40"
      >
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
      </section>
    </FilterLayout>
  );
}

// Filtros ligados, cada um com o link que o tira.
function activeFilters(filters: AdoptionFilters) {
  const chips: { key: string; label: string; href: string }[] = [];
  if (filters.species)
    chips.push({
      key: "especie",
      label: speciesLabels[speciesSlugs[filters.species]],
      href: adoptionHref(filters, { species: null }),
    });
  if (filters.size)
    chips.push({
      key: "porte",
      label: `Porte ${animalSizeLabels[sizeSlugs[filters.size]].toLowerCase()}`,
      href: adoptionHref(filters, { size: null }),
    });
  if (filters.age)
    chips.push({
      key: "idade",
      label: ageGroups[filters.age].label,
      href: adoptionHref(filters, { age: null }),
    });
  for (const slug of filters.temperament)
    chips.push({
      key: `temperamento-${slug}`,
      label: temperamentLabels[temperamentSlugs[slug]],
      href: adoptionHref(filters, { temperament: filters.temperament.filter((t) => t !== slug) }),
    });
  return chips;
}

// Opção em forma de "chip": a caixa fica escondida e o rótulo muda de cor quando marcado.
const chip =
  "cursor-pointer rounded-full border border-adopt-200 bg-surface px-3.5 py-1.5 text-sm text-adopt-900 transition-colors hover:border-adopt-400 has-checked:border-adopt-700 has-checked:bg-adopt-700 has-checked:font-medium has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-adopt-600 dark:border-adopt-900 dark:text-adopt-100 dark:has-checked:border-adopt-400 dark:has-checked:bg-adopt-400 dark:has-checked:text-adopt-950";

// Grupo de chips de escolha única, com "qualquer" primeiro.
function ChoiceChips({
  name,
  legend,
  anyLabel,
  value,
  options,
}: {
  name: string;
  legend: string;
  anyLabel: string;
  value: string | null;
  options: { value: string; label: string; title?: string }[];
}) {
  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">{legend}</legend>
      <label className={chip}>
        <input type="radio" name={name} value="" defaultChecked={!value} className="sr-only" />
        {anyLabel}
      </label>
      {options.map((option) => (
        <label key={option.value} className={chip} title={option.title}>
          <input
            type="radio"
            name={name}
            value={option.value}
            defaultChecked={value === option.value}
            className="sr-only"
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}

function Filters({ filters, hasFilters }: { filters: AdoptionFilters; hasFilters: boolean }) {
  return (
    <form action="/adocao" aria-label="Filtros" className="flex flex-1 flex-col">
      <FilterSection title="Quem você procura?">
        <ChoiceChips
          name="especie"
          legend="Espécie"
          anyLabel="Todos"
          value={filters.species}
          options={SPECIES_FILTER.map((slug) => ({
            value: slug,
            label: speciesLabels[speciesSlugs[slug]],
          }))}
        />
      </FilterSection>

      <FilterSection title="Porte">
        <ChoiceChips
          name="porte"
          legend="Porte"
          anyLabel="Qualquer"
          value={filters.size}
          options={Object.entries(sizeSlugs).map(([slug, size]) => ({
            value: slug,
            label: animalSizeLabels[size],
          }))}
        />
      </FilterSection>

      <FilterSection title="Idade">
        <ChoiceChips
          name="idade"
          legend="Idade"
          anyLabel="Qualquer"
          value={filters.age}
          options={Object.entries(ageGroups).map(([slug, group]) => ({
            value: slug,
            label: group.label.split(" (")[0],
            title: group.label,
          }))}
        />
      </FilterSection>

      <FilterSection title="Que jeito combina com a sua casa?">
        <fieldset className="flex flex-wrap gap-2">
          <legend className="sr-only">Temperamento</legend>
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
        </fieldset>
      </FilterSection>

      <div className="sticky bottom-0 mt-auto flex items-center gap-3 bg-surface px-5 py-4">
        <button type="submit" className={buttonClasses({ block: true })}>
          Mostrar animais
        </button>
        {hasFilters && (
          <Link
            href="/adocao"
            className="shrink-0 text-sm text-zinc-600 underline dark:text-zinc-400"
          >
            Limpar
          </Link>
        )}
      </div>
    </form>
  );
}
