import "server-only";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

// Leituras do catálogo para o admin. Cada função confere o papel antes de tocar no banco.

export async function listCategories() {
  await requireAdmin();
  return prisma.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      position: true,
      parentId: true,
      parent: { select: { name: true } },
      _count: { select: { products: true, children: true } },
    },
  });
}

export async function getCategory(id: string) {
  await requireAdmin();
  return prisma.category.findUnique({ where: { id } });
}

export async function listBrands() {
  await requireAdmin();
  return prisma.brand.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, _count: { select: { products: true } } },
  });
}

export async function listProducts() {
  await requireAdmin();
  return prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      active: true,
      donationEligible: true,
      category: { select: { name: true } },
      brand: { select: { name: true } },
      _count: { select: { variants: true } },
    },
  });
}

export async function getProduct(id: string) {
  await requireAdmin();
  return prisma.product.findUnique({ where: { id } });
}

// Opções dos selects de categoria e marca nos formulários.
export async function getCatalogOptions() {
  await requireAdmin();
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, parentId: true },
    }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return { categories, brands };
}

export async function listProductImages(productId: string) {
  await requireAdmin();
  return prisma.productImage.findMany({
    where: { productId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true, url: true, alt: true },
  });
}

export async function listProductVariants(productId: string) {
  await requireAdmin();
  return prisma.productVariant.findMany({
    where: { productId },
    orderBy: [{ active: "desc" }, { priceCents: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      sku: true,
      priceCents: true,
      weightGrams: true,
      attributes: true,
      active: true,
    },
  });
}

export async function getProductVariant(variantId: string) {
  await requireAdmin();
  return prisma.productVariant.findUnique({
    where: { id: variantId },
    select: {
      id: true,
      productId: true,
      name: true,
      sku: true,
      priceCents: true,
      weightGrams: true,
      attributes: true,
      active: true,
      product: { select: { name: true } },
    },
  });
}

// Saldos de todas as variações, para a tela de estoque.
export async function listStock(onlyLow: boolean) {
  await requireAdmin();
  const variants = await prisma.productVariant.findMany({
    orderBy: [{ product: { name: "asc" } }, { priceCents: "asc" }],
    select: {
      id: true,
      name: true,
      sku: true,
      active: true,
      product: { select: { id: true, name: true, active: true } },
      stockLevels: { select: { location: true, quantity: true } },
    },
  });
  const rows = variants.map((variant) => {
    const level = (location: "STORE" | "SHELTER") =>
      variant.stockLevels.find((l) => l.location === location)?.quantity ?? 0;
    return { ...variant, store: level("STORE"), shelter: level("SHELTER") };
  });
  return onlyLow ? rows.filter((row) => row.store <= LOW_STOCK) : rows;
}

// Abaixo ou igual a este saldo na loja, a variação aparece como "estoque baixo".
export const LOW_STOCK = 3;

export async function getVariantStock(variantId: string) {
  await requireAdmin();
  return prisma.productVariant.findUnique({
    where: { id: variantId },
    select: {
      id: true,
      name: true,
      sku: true,
      product: { select: { id: true, name: true } },
      stockLevels: { select: { location: true, quantity: true } },
      stockMovements: {
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          type: true,
          fromLocation: true,
          toLocation: true,
          quantity: true,
          note: true,
          createdAt: true,
          createdBy: { select: { name: true } },
          order: { select: { number: true } },
        },
      },
    },
  });
}
