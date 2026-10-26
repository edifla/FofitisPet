import type { Species } from "@/app/generated/prisma/client";
import { parseBRL } from "@/lib/money";

// Filtros do catálogo na URL, em português: /produtos?q=racao&especie=gatos&marca=golden

export const speciesSlugs: Record<string, Species> = {
  caes: "DOG",
  gatos: "CAT",
  passaros: "BIRD",
  peixes: "FISH",
  "pequenos-pets": "SMALL_PET",
  outros: "OTHER",
};

// Ordenação (KAN-100). Em todas, os produtos esgotados vão para o fim.
export const catalogSorts = {
  relevancia: "Relevância",
  "menor-preco": "Menor preço",
  "maior-preco": "Maior preço",
  nome: "Nome (A–Z)",
  novidades: "Novidades",
} as const;

export type CatalogSort = keyof typeof catalogSorts;

export type CatalogFilters = {
  q: string;
  species: string | null;
  category: string | null;
  brands: string[];
  minPrice: string;
  maxPrice: string;
  sort: CatalogSort;
  page: number;
};

type Params = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) ?? "";
const slug = (value: string) => (/^[a-z0-9-]{1,80}$/.test(value) ? value : null);

export function parseCatalogParams(params: Params): CatalogFilters {
  const brands = [params.marca ?? []]
    .flat()
    .map(String)
    .map(slug)
    .filter((b): b is string => b !== null);
  const species = first(params.especie);
  const sort = first(params.ordem);
  return {
    q: first(params.q).trim().slice(0, 100),
    species: Object.hasOwn(speciesSlugs, species) ? species : null,
    category: slug(first(params.categoria)),
    brands: [...new Set(brands)].slice(0, 20),
    minPrice: first(params.preco_min).trim().slice(0, 12),
    maxPrice: first(params.preco_max).trim().slice(0, 12),
    sort: Object.hasOwn(catalogSorts, sort) ? (sort as CatalogSort) : "relevancia",
    page: Math.max(1, Math.min(1000, Number(first(params.pagina)) || 1)),
  };
}

// Valores já convertidos para a consulta; preços inválidos são ignorados.
export function toCatalogQuery(filters: CatalogFilters) {
  return {
    q: filters.q,
    species: filters.species ? speciesSlugs[filters.species] : undefined,
    category: filters.category ?? undefined,
    brands: filters.brands,
    minPriceCents: filters.minPrice ? (parseBRL(filters.minPrice) ?? undefined) : undefined,
    maxPriceCents: filters.maxPrice ? (parseBRL(filters.maxPrice) ?? undefined) : undefined,
    sort: filters.sort,
    page: filters.page,
  };
}

// Monta a URL do catálogo mantendo os filtros atuais, com alterações pontuais.
export function catalogHref(filters: CatalogFilters, changes: Partial<CatalogFilters> = {}) {
  const next = { ...filters, page: 1, ...changes };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.species) params.set("especie", next.species);
  if (next.category) params.set("categoria", next.category);
  for (const brand of next.brands) params.append("marca", brand);
  if (next.minPrice) params.set("preco_min", next.minPrice);
  if (next.maxPrice) params.set("preco_max", next.maxPrice);
  if (next.sort !== "relevancia") params.set("ordem", next.sort);
  if (next.page > 1) params.set("pagina", String(next.page));
  const query = params.toString();
  return query ? `/produtos?${query}` : "/produtos";
}
