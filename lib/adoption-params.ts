import type { AnimalSize, Temperament } from "@/app/generated/prisma/client";
import type { AgeGroup } from "@/lib/adoption";
import { speciesSlugs } from "@/lib/catalog-params";

// Filtros da listagem de adoção na URL, em português: /adocao?especie=gatos&porte=pequeno

export const sizeSlugs: Record<string, AnimalSize> = {
  pequeno: "SMALL",
  medio: "MEDIUM",
  grande: "LARGE",
};

export const temperamentSlugs: Record<string, Temperament> = {
  calmo: "CALM",
  brincalhao: "PLAYFUL",
  energetico: "ENERGETIC",
  timido: "SHY",
  carinhoso: "AFFECTIONATE",
  independente: "INDEPENDENT",
  "bom-com-criancas": "GOOD_WITH_KIDS",
  "bom-com-caes": "GOOD_WITH_DOGS",
  "bom-com-gatos": "GOOD_WITH_CATS",
};

const AGE_GROUPS: AgeGroup[] = ["filhote", "jovem", "adulto", "idoso"];

export type AdoptionFilters = {
  species: string | null;
  size: string | null;
  age: AgeGroup | null;
  temperament: string[];
  page: number;
};

type Params = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? "";

export function parseAdoptionParams(params: Params): AdoptionFilters {
  const species = first(params.especie);
  const size = first(params.porte);
  const age = first(params.idade);
  const temperament = [params.temperamento ?? []]
    .flat()
    .map(String)
    .filter((t) => Object.hasOwn(temperamentSlugs, t));
  return {
    species: Object.hasOwn(speciesSlugs, species) ? species : null,
    size: Object.hasOwn(sizeSlugs, size) ? size : null,
    age: (AGE_GROUPS as string[]).includes(age) ? (age as AgeGroup) : null,
    temperament: [...new Set(temperament)],
    page: Math.max(1, Math.min(1000, Number(first(params.pagina)) || 1)),
  };
}

export function toAdoptionQuery(filters: AdoptionFilters) {
  return {
    species: filters.species ? speciesSlugs[filters.species] : undefined,
    size: filters.size ? sizeSlugs[filters.size] : undefined,
    age: filters.age ?? undefined,
    temperament: filters.temperament.map((t) => temperamentSlugs[t]),
    page: filters.page,
  };
}

export function adoptionHref(filters: AdoptionFilters, changes: Partial<AdoptionFilters> = {}) {
  const next = { ...filters, page: 1, ...changes };
  const params = new URLSearchParams();
  if (next.species) params.set("especie", next.species);
  if (next.size) params.set("porte", next.size);
  if (next.age) params.set("idade", next.age);
  for (const t of next.temperament) params.append("temperamento", t);
  if (next.page > 1) params.set("pagina", String(next.page));
  const query = params.toString();
  return query ? `/adocao?${query}` : "/adocao";
}
