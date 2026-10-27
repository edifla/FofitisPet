import "server-only";
import type { AnimalSize, Prisma, Species, Temperament } from "@/app/generated/prisma/client";
import { foodVariantWhere } from "@/lib/food";
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
        story: true,
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

// Perfil público do animal (KAN-38). Animais fora da listagem não têm perfil.
export async function getAnimalBySlug(slug: string) {
  return prisma.animal.findFirst({
    where: { slug, status: { in: ["AVAILABLE", "RESERVED", "ADOPTED"] } },
    select: {
      id: true,
      name: true,
      slug: true,
      species: true,
      size: true,
      sex: true,
      birthDate: true,
      temperament: true,
      story: true,
      healthNotes: true,
      specialNeeds: true,
      neutered: true,
      dewormed: true,
      status: true,
      arrivedAt: true,
      images: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: { id: true, url: true, alt: true },
      },
      vaccinations: {
        orderBy: { appliedAt: "desc" },
        select: { id: true, name: true, appliedAt: true, nextDoseAt: true },
      },
    },
  });
}

// Ração recebida pelo animal (KAN-45): soma, em gramas, do que foi registrado no consumo do
// abrigo para ele (KAN-34) em itens de alimentação.
export async function getFoodReceivedGrams(animalId: string) {
  const consumptions = await prisma.shelterConsumption.findMany({
    where: { animalId, variant: foodVariantWhere() },
    select: { quantity: true, variant: { select: { weightGrams: true } } },
  });
  return consumptions.reduce((sum, c) => sum + c.quantity * (c.variant.weightGrams ?? 0), 0);
}

// Outros animais disponíveis, para o fim do perfil ("também esperam por uma família").
export async function getOtherAnimals(excludeId: string, take = 3) {
  const { animals } = await searchAnimals({});
  return animals.filter((a) => a.id !== excludeId && a.status === "AVAILABLE").slice(0, take);
}

type Describable = {
  sex: "MALE" | "FEMALE";
  size: "SMALL" | "MEDIUM" | "LARGE";
  birthDate: Date | null;
};

const sizeWords = { SMALL: "porte pequeno", MEDIUM: "porte médio", LARGE: "porte grande" } as const;

// Artigo do nome no texto: "a Mel", "o Thor".
export const article = (sex: Describable["sex"]) => (sex === "FEMALE" ? "a" : "o");

// "Fêmea, 2 anos, porte pequeno" — em frase, não em ficha técnica.
export function describeAnimal(animal: Describable) {
  const age = formatAge(animal.birthDate);
  return [
    animal.sex === "FEMALE" ? "Fêmea" : "Macho",
    age === "Idade desconhecida" ? "idade desconhecida" : age.toLowerCase(),
    sizeWords[animal.size],
  ].join(", ");
}

// Primeira frase da história, para o card da listagem.
export function storyTeaser(story: string, max = 110) {
  const first = story.split(/(?<=[.!?])\s/)[0] ?? story;
  return first.length > max ? `${first.slice(0, max - 1).trimEnd()}…` : first;
}
