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
