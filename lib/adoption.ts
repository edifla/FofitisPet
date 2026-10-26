import "server-only";
import type { AnimalSize, Prisma, Species, Temperament } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// Animais para adoção (KAN-37). Só aparecem os disponíveis e os reservados.

export const ADOPTION_PAGE_SIZE = 24;

export type AgeGroup = "filhote" | "jovem" | "adulto" | "idoso";

// Faixas de idade, em anos completos: [mínimo, máximo).
export const ageGroups: Record<AgeGroup, { label: string; min: number; max: number | null }> = {
  filhote: { label: "Filhote (até 1 ano)", min: 0, max: 1 },
  jovem: { label: "Jovem (1 a 3 anos)", min: 1, max: 3 },
  adulto: { label: "Adulto (3 a 8 anos)", min: 3, max: 8 },
  idoso: { label: "Idoso (8 anos ou mais)", min: 8, max: null },
};

export type AdoptionQuery = {
  species?: Species;
  size?: AnimalSize;
  age?: AgeGroup;
  temperament?: Temperament[];
  page?: number;
};

const yearsAgo = (years: number) => {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - years);
  return date;
};

export async function searchAnimals({
  species,
  size,
  age,
  temperament = [],
  page = 1,
}: AdoptionQuery) {
  const where: Prisma.AnimalWhereInput = {
    status: { in: ["AVAILABLE", "RESERVED"] },
    ...(species && { species }),
    ...(size && { size }),
    // Todas as características marcadas precisam estar no animal.
    ...(temperament.length > 0 && { temperament: { hasEvery: temperament } }),
  };
  if (age) {
    const { min, max } = ageGroups[age];
    // Nascido há pelo menos `min` anos e há menos de `max` anos. Sem data de nascimento, o
    // animal não entra quando há filtro de idade.
    where.birthDate = {
      lte: yearsAgo(min),
      ...(max !== null && { gt: yearsAgo(max) }),
    };
  }

  const [total, animals] = await Promise.all([
    prisma.animal.count({ where }),
    prisma.animal.findMany({
      where,
      // Disponíveis primeiro; dentro de cada grupo, os que chegaram há mais tempo.
      orderBy: [{ status: "asc" }, { arrivedAt: { sort: "asc", nulls: "last" } }, { name: "asc" }],
      skip: (Math.max(1, page) - 1) * ADOPTION_PAGE_SIZE,
      take: ADOPTION_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        slug: true,
        species: true,
        size: true,
        sex: true,
        birthDate: true,
        temperament: true,
        status: true,
        images: {
          orderBy: [{ position: "asc" }, { createdAt: "asc" }],
          take: 1,
          select: { url: true, alt: true },
        },
      },
    }),
  ]);
  return { animals, total, pageCount: Math.ceil(total / ADOPTION_PAGE_SIZE) };
}

// "2 anos", "8 meses", "Idade desconhecida".
export function formatAge(birthDate: Date | null, now = new Date()) {
  if (!birthDate) return "Idade desconhecida";
  let months =
    (now.getUTCFullYear() - birthDate.getUTCFullYear()) * 12 +
    now.getUTCMonth() -
    birthDate.getUTCMonth();
  if (now.getUTCDate() < birthDate.getUTCDate()) months--;
  months = Math.max(0, months);
  if (months < 12) return months <= 1 ? "Menos de 2 meses" : `${months} meses`;
  const years = Math.floor(months / 12);
  return years === 1 ? "1 ano" : `${years} anos`;
}
