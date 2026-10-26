"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/app/generated/prisma/client";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import {
  brandSchema,
  categorySchema,
  fieldErrors,
  productSchema,
  type FormState,
} from "@/lib/validation/catalog";

// Toda ação confere o papel de admin por conta própria: Server Actions são endpoints públicos.

function isPrismaError(error: unknown, code: string) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

// ---------------------------------------------------------------------------
// Categorias
// ---------------------------------------------------------------------------

function categoryValues(formData: FormData) {
  return {
    name: text(formData, "name"),
    slug: text(formData, "slug"),
    description: text(formData, "description"),
    parentId: text(formData, "parentId"),
    position: text(formData, "position") || "0",
  };
}

// A categoria pai não pode ser a própria categoria nem uma das suas subcategorias.
async function createsCycle(categoryId: string, parentId: string | null) {
  let current = parentId;
  while (current) {
    if (current === categoryId) return true;
    const parent = await prisma.category.findUnique({
      where: { id: current },
      select: { parentId: true },
    });
    current = parent?.parentId ?? null;
  }
  return false;
}

export async function saveCategory(
  categoryId: string | null,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = categoryValues(formData);
  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  if (categoryId && (await createsCycle(categoryId, parsed.data.parentId))) {
    return {
      errors: { parentId: ["A categoria pai não pode ser ela mesma nem uma subcategoria dela."] },
      values,
    };
  }

  try {
    if (categoryId) {
      await prisma.category.update({ where: { id: categoryId }, data: parsed.data });
    } else {
      await prisma.category.create({ data: parsed.data });
    }
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      return { errors: { slug: ["Já existe uma categoria com este slug."] }, values };
    }
    throw error;
  }

  revalidatePath("/admin/categorias");
  redirect("/admin/categorias");
}

export async function deleteCategory(categoryId: string): Promise<FormState> {
  await requireAdmin();
  try {
    await prisma.category.delete({ where: { id: categoryId } });
  } catch (error) {
    if (isPrismaError(error, "P2003")) {
      return { message: "Esta categoria tem produtos. Mova os produtos antes de excluir." };
    }
    throw error;
  }
  refresh();
  return { success: true };
}

// ---------------------------------------------------------------------------
// Marcas
// ---------------------------------------------------------------------------

export async function createBrand(_state: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const values = { name: text(formData, "name"), slug: text(formData, "slug") };
  const parsed = brandSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  try {
    await prisma.brand.create({ data: parsed.data });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      return { errors: { slug: ["Já existe uma marca com este slug."] }, values };
    }
    throw error;
  }
  refresh();
  return { success: true, message: `Marca "${parsed.data.name}" criada.` };
}

export async function deleteBrand(brandId: string): Promise<FormState> {
  await requireAdmin();
  // Produtos da marca ficam sem marca (onDelete: SetNull).
  await prisma.brand.delete({ where: { id: brandId } });
  refresh();
  return { success: true };
}

// ---------------------------------------------------------------------------
// Produtos
// ---------------------------------------------------------------------------

function productValues(formData: FormData) {
  return {
    name: text(formData, "name"),
    slug: text(formData, "slug"),
    description: text(formData, "description"),
    categoryId: text(formData, "categoryId"),
    brandId: text(formData, "brandId"),
    species: formData.getAll("species").map(String),
  };
}

export async function saveProduct(
  productId: string | null,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = productValues(formData);
  const parsed = productSchema.safeParse({
    ...values,
    donationEligible: formData.get("donationEligible") === "on",
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  try {
    if (productId) {
      await prisma.product.update({ where: { id: productId }, data: parsed.data });
    } else {
      await prisma.product.create({ data: parsed.data });
    }
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      return { errors: { slug: ["Já existe um produto com este slug."] }, values };
    }
    if (isPrismaError(error, "P2003")) {
      return { errors: { categoryId: ["Categoria ou marca não encontrada."] }, values };
    }
    throw error;
  }

  revalidatePath("/admin/produtos");
  redirect("/admin/produtos");
}

export async function deleteProduct(productId: string): Promise<FormState> {
  await requireAdmin();
  try {
    await prisma.product.delete({ where: { id: productId } });
  } catch (error) {
    // Variações já vendidas ou com movimento de estoque não podem sumir do histórico.
    if (isPrismaError(error, "P2003")) {
      return {
        message:
          "Este produto já tem pedidos ou movimentos de estoque. Desative-o em vez de excluir.",
      };
    }
    throw error;
  }
  revalidatePath("/admin/produtos");
  redirect("/admin/produtos");
}
