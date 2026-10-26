import "server-only";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// Catálogo público (KAN-22). Só entram produtos ativos com pelo menos uma variação ativa.

export const PAGE_SIZE = 24;

export type CatalogQuery = {
  // Busca por texto (KAN-98): todas as palavras precisam aparecer, sem diferenciar acentos.
  q?: string;
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

export async function searchCatalog({ q, page = 1 }: CatalogQuery) {
  const terms = searchTerms(q);
  const conditions: Prisma.Sql[] = [
    Prisma.sql`p.active`,
    Prisma.sql`EXISTS (SELECT 1 FROM "ProductVariant" v WHERE v."productId" = p.id AND v.active)`,
  ];
  for (const term of terms) {
    conditions.push(
      Prisma.sql`unaccent(p.name || ' ' || coalesce(b.name, '') || ' ' || c.name || ' ' || p.description) ILIKE unaccent(${likePattern(term)})`,
    );
  }
  const where = Prisma.join(conditions, " AND ");
  // Com busca, produtos com o termo no nome vêm primeiro.
  const nameMatch = terms.length
    ? Prisma.sql`unaccent(p.name) ILIKE unaccent(${likePattern(terms.join(" "))}) DESC,`
    : Prisma.empty;
  const offset = (Math.max(1, page) - 1) * PAGE_SIZE;

  const [rows, [{ total }]] = await Promise.all([
    prisma.$queryRaw<{ id: string }[]>`
      SELECT p.id
      FROM "Product" p
      JOIN "Category" c ON c.id = p."categoryId"
      LEFT JOIN "Brand" b ON b.id = p."brandId"
      WHERE ${where}
      ORDER BY ${nameMatch} p.name ASC
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
