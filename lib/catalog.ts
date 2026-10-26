import "server-only";
import { Prisma, type Species } from "@/app/generated/prisma/client";
import type { CatalogSort } from "@/lib/catalog-params";
import { prisma } from "@/lib/prisma";

// Catálogo público (KAN-22). Só entram produtos ativos com pelo menos uma variação ativa.

export const PAGE_SIZE = 24;

export type CatalogQuery = {
  // Busca por texto (KAN-98): todas as palavras precisam aparecer, sem diferenciar acentos.
  q?: string;
  // Filtros (KAN-99). A categoria inclui as subcategorias; o preço vale para qualquer
  // variação ativa do produto.
  species?: Species;
  category?: string;
  brands?: string[];
  minPriceCents?: number;
  maxPriceCents?: number;
  sort?: CatalogSort;
  page?: number;
};

export type CatalogItem = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  coverUrl: string | null;
  coverAlt: string | null;
  minPriceCents: number;
  inStock: boolean;
};

// "%" e "_" digitados pelo cliente são texto, não curingas do LIKE.
function likePattern(term: string) {
  return `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

function searchTerms(q: string | undefined) {
  return (q ?? "")
    .trim()
    .split(/\s+/)
    .filter((term) => term.length >= 2)
    .slice(0, 8);
}

export async function searchCatalog({
  q,
  species,
  category,
  brands = [],
  minPriceCents,
  maxPriceCents,
  sort = "relevancia",
  page = 1,
}: CatalogQuery) {
  const terms = searchTerms(q);
  const priceConditions = [
    minPriceCents !== undefined ? Prisma.sql`v."priceCents" >= ${minPriceCents}` : null,
    maxPriceCents !== undefined ? Prisma.sql`v."priceCents" <= ${maxPriceCents}` : null,
  ].filter((condition): condition is Prisma.Sql => condition !== null);
  const conditions: Prisma.Sql[] = [
    Prisma.sql`p.active`,
    Prisma.sql`EXISTS (SELECT 1 FROM "ProductVariant" v WHERE v."productId" = p.id AND v.active ${
      priceConditions.length
        ? Prisma.sql`AND ${Prisma.join(priceConditions, " AND ")}`
        : Prisma.empty
    })`,
  ];
  if (species) {
    conditions.push(Prisma.sql`${species}::"Species" = ANY(p.species)`);
  }
  if (category) {
    conditions.push(Prisma.sql`p."categoryId" IN (
      WITH RECURSIVE tree AS (
        SELECT id FROM "Category" WHERE slug = ${category}
        UNION ALL
        SELECT child.id FROM "Category" child JOIN tree ON child."parentId" = tree.id
      )
      SELECT id FROM tree)`);
  }
  if (brands.length) {
    conditions.push(Prisma.sql`b.slug IN (${Prisma.join(brands)})`);
  }
  for (const term of terms) {
    conditions.push(
      Prisma.sql`unaccent(p.name || ' ' || coalesce(b.name, '') || ' ' || c.name || ' ' || p.description) ILIKE unaccent(${likePattern(term)})`,
    );
  }
  const where = Prisma.join(conditions, " AND ");
  // Menor preço entre as variações ativas, e se alguma delas tem estoque na loja.
  const minPrice = Prisma.sql`(SELECT min(v."priceCents") FROM "ProductVariant" v WHERE v."productId" = p.id AND v.active)`;
  const inStock = Prisma.sql`EXISTS (
    SELECT 1 FROM "ProductVariant" v JOIN "StockLevel" sl ON sl."variantId" = v.id
    WHERE v."productId" = p.id AND v.active AND sl.location = 'STORE' AND sl.quantity > 0)`;
  const orderBy = {
    // Com busca, produtos com o termo no nome vêm primeiro.
    relevancia: terms.length
      ? Prisma.sql`unaccent(p.name) ILIKE unaccent(${likePattern(terms.join(" "))}) DESC, p.name ASC`
      : Prisma.sql`p.name ASC`,
    "menor-preco": Prisma.sql`${minPrice} ASC, p.name ASC`,
    "maior-preco": Prisma.sql`${minPrice} DESC, p.name ASC`,
    nome: Prisma.sql`p.name ASC`,
    novidades: Prisma.sql`p."createdAt" DESC, p.name ASC`,
  }[sort];
  const offset = (Math.max(1, page) - 1) * PAGE_SIZE;

  const [rows, [{ total }]] = await Promise.all([
    prisma.$queryRaw<{ id: string }[]>`
      SELECT p.id
      FROM "Product" p
      JOIN "Category" c ON c.id = p."categoryId"
      LEFT JOIN "Brand" b ON b.id = p."brandId"
      WHERE ${where}
      ORDER BY ${inStock} DESC, ${orderBy}
      LIMIT ${PAGE_SIZE} OFFSET ${offset}`,
    prisma.$queryRaw<{ total: bigint }[]>`
      SELECT count(*) AS total
      FROM "Product" p
      JOIN "Category" c ON c.id = p."categoryId"
      LEFT JOIN "Brand" b ON b.id = p."brandId"
      WHERE ${where}`,
  ]);

  const ids = rows.map((row) => row.id);
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      name: true,
      slug: true,
      brand: { select: { name: true } },
      images: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        take: 1,
        select: { url: true, alt: true },
      },
      variants: {
        where: { active: true },
        select: {
          priceCents: true,
          stockLevels: { where: { location: "STORE" }, select: { quantity: true } },
        },
      },
    },
  });
  const byId = new Map(products.map((product) => [product.id, product]));

  const items: CatalogItem[] = ids.flatMap((id) => {
    const product = byId.get(id);
    if (!product) return [];
    return [
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        brand: product.brand?.name ?? null,
        coverUrl: product.images[0]?.url ?? null,
        coverAlt: product.images[0]?.alt ?? null,
        minPriceCents: Math.min(...product.variants.map((v) => v.priceCents)),
        inStock: product.variants.some((v) => (v.stockLevels[0]?.quantity ?? 0) > 0),
      },
    ];
  });

  return {
    items,
    total: Number(total),
    page: Math.max(1, page),
    pageCount: Math.ceil(Number(total) / PAGE_SIZE),
  };
}

// Opções dos filtros: só categorias e marcas que têm produto à venda.
export async function getCatalogFilterOptions() {
  const forSale = {
    active: true,
    variants: { some: { active: true } },
  } satisfies Prisma.ProductWhereInput;
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      where: {
        OR: [
          { products: { some: forSale } },
          { children: { some: { products: { some: forSale } } } },
        ],
      },
      orderBy: [{ position: "asc" }, { name: "asc" }],
      select: { slug: true, name: true, parentId: true, id: true },
    }),
    prisma.brand.findMany({
      where: { products: { some: forSale } },
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
  ]);
  // Subcategorias logo abaixo da categoria pai, para o select.
  const roots = categories.filter(
    (c) => !c.parentId || !categories.some((p) => p.id === c.parentId),
  );
  const ordered = roots.flatMap((root) => [
    { slug: root.slug, name: root.name, depth: 0 },
    ...categories
      .filter((c) => c.parentId === root.id)
      .map((child) => ({ slug: child.slug, name: child.name, depth: 1 })),
  ]);
  return { categories: ordered, brands };
}

// Abaixo ou igual a este saldo, a página mostra "Últimas unidades".
export const FEW_LEFT = 3;

// Página do produto (KAN-23). Nulo se o produto não está à venda.
export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, active: true, variants: { some: { active: true } } },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      species: true,
      donationEligible: true,
      brand: { select: { name: true, slug: true } },
      category: {
        select: { name: true, slug: true, parent: { select: { name: true, slug: true } } },
      },
      images: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        select: { id: true, url: true, alt: true },
      },
      variants: {
        where: { active: true },
        orderBy: [{ priceCents: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          priceCents: true,
          weightGrams: true,
          attributes: true,
          stockLevels: { where: { location: "STORE" }, select: { quantity: true } },
        },
      },
    },
  });
  if (!product) return null;
  return {
    ...product,
    variants: product.variants.map(({ stockLevels, ...variant }) => ({
      ...variant,
      stock: stockLevels[0]?.quantity ?? 0,
    })),
  };
}

export type ProductPageData = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;
