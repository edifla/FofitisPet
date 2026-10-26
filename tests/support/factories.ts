import { randomUUID } from "node:crypto";
import type { Species } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { resetCookies } from "./setup";

// Dados de teste criados direto no banco. Cada arquivo de teste começa com o banco vazio.

export async function resetDatabase() {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  const list = tables.map((t) => `"public"."${t.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE ${list} RESTART IDENTITY CASCADE`);
  resetCookies();
}

const unique = () => randomUUID().slice(0, 8);

export function createUser(role: "CUSTOMER" | "ADMIN" = "CUSTOMER", name = "Ana Souza") {
  return prisma.user.create({
    data: { name, email: `${role.toLowerCase()}-${unique()}@teste.test`, role },
  });
}

export function createAddress(userId: string, state = "SP") {
  return prisma.address.create({
    data: {
      userId,
      recipientName: "Ana Souza",
      zipCode: "13010000",
      street: "Rua Teste",
      number: "10",
      neighborhood: "Centro",
      city: "Campinas",
      state,
    },
  });
}

type ProductInput = {
  priceCents?: number;
  stock?: number;
  weightGrams?: number | null;
  donationEligible?: boolean;
  // "alimentacao" conta como ração (lib/food.ts).
  categorySlug?: string;
  species?: Species[];
};

// Cria categoria (se preciso), produto e uma variação com estoque na loja.
export async function createVariant({
  priceCents = 5000,
  stock = 10,
  weightGrams = 1000,
  donationEligible = true,
  categorySlug = "alimentacao",
  species = ["DOG"],
}: ProductInput = {}) {
  const category = await prisma.category.upsert({
    where: { slug: categorySlug },
    create: { name: categorySlug, slug: categorySlug },
    update: {},
  });
  const id = unique();
  return prisma.productVariant.create({
    data: {
      sku: `TEST-${id}`,
      name: weightGrams ? `${weightGrams} g` : "Único",
      priceCents,
      weightGrams,
      product: {
        create: {
          name: `Produto ${id}`,
          slug: `produto-${id}`,
          description: "Produto criado nos testes.",
          categoryId: category.id,
          species,
          donationEligible,
        },
      },
      stockLevels: { create: { location: "STORE", quantity: stock } },
    },
  });
}

export async function stockOf(variantId: string, location: "STORE" | "SHELTER") {
  const level = await prisma.stockLevel.findUnique({
    where: { variantId_location: { variantId, location } },
  });
  return level?.quantity ?? 0;
}

export function createAnimal(status: "AVAILABLE" | "RESERVED" | "ADOPTED" = "AVAILABLE") {
  const id = unique();
  return prisma.animal.create({
    data: {
      name: `Rex ${id}`,
      slug: `rex-${id}`,
      species: "DOG",
      size: "MEDIUM",
      sex: "MALE",
      story: "Animal criado nos testes automatizados.",
      status,
    },
  });
}
