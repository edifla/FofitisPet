"use server";

import { randomUUID } from "node:crypto";
import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/app/generated/prisma/client";
import { requireAdmin } from "@/lib/dal";
import { detectImage, MAX_IMAGE_BYTES, MAX_IMAGES_PER_UPLOAD } from "@/lib/images";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import {
  brandSchema,
  categorySchema,
  fieldErrors,
  productSchema,
  variantSchema,
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
  const images = await prisma.productImage.findMany({
    where: { productId },
    select: { storageKey: true },
  });
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
  // As linhas das imagens saem junto com o produto (cascade); os arquivos, só aqui.
  await Promise.all(images.map((image) => storage.remove(image.storageKey)));
  revalidatePath("/admin/produtos");
  redirect("/admin/produtos");
}

// ---------------------------------------------------------------------------
// Imagens dos produtos (KAN-95)
// ---------------------------------------------------------------------------

export async function uploadProductImages(
  productId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { name: true, _count: { select: { images: true } } },
  });
  if (!product) return { message: "Produto não encontrado." };

  const files = formData
    .getAll("images")
    .filter((file): file is File => file instanceof File && file.size > 0);
  if (files.length === 0) return { message: "Escolha pelo menos uma imagem." };
  if (files.length > MAX_IMAGES_PER_UPLOAD) {
    return { message: `Envie no máximo ${MAX_IMAGES_PER_UPLOAD} imagens por vez.` };
  }

  // Valida todas antes de gravar qualquer uma.
  const accepted: { bytes: Uint8Array; ext: string }[] = [];
  for (const file of files) {
    if (file.size > MAX_IMAGE_BYTES) {
      return { message: `"${file.name}" passa de ${MAX_IMAGE_BYTES / 1024 / 1024} MB.` };
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const image = detectImage(bytes);
    if (!image) return { message: `"${file.name}" não é uma imagem JPG, PNG ou WebP.` };
    accepted.push({ bytes, ext: image.ext });
  }

  const alt = text(formData, "alt").trim().slice(0, 200) || product.name;
  let position = product._count.images;
  for (const { bytes, ext } of accepted) {
    const storageKey = `produtos/${productId}/${randomUUID()}.${ext}`;
    await storage.save(storageKey, bytes);
    await prisma.productImage.create({
      data: {
        productId,
        storageKey,
        url: storage.publicUrl(storageKey),
        alt,
        position: position++,
      },
    });
  }

  refresh();
  return { success: true, message: `${accepted.length} imagem(ns) enviada(s).` };
}

export async function deleteProductImage(imageId: string): Promise<FormState> {
  await requireAdmin();
  const image = await prisma.productImage.delete({
    where: { id: imageId },
    select: { storageKey: true },
  });
  await storage.remove(image.storageKey);
  refresh();
  return { success: true };
}

// Troca a imagem de lugar com a vizinha (-1 = para a esquerda, 1 = para a direita).
// A primeira imagem é a capa do produto.
export async function moveProductImage(imageId: string, direction: -1 | 1): Promise<FormState> {
  await requireAdmin();
  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
    select: { productId: true },
  });
  if (!image) return { message: "Imagem não encontrada." };

  const images = await prisma.productImage.findMany({
    where: { productId: image.productId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const from = images.findIndex((i) => i.id === imageId);
  const to = from + direction;
  if (to < 0 || to >= images.length) return { success: true };

  [images[from], images[to]] = [images[to], images[from]];
  await prisma.$transaction(
    images.map((i, position) =>
      prisma.productImage.update({ where: { id: i.id }, data: { position } }),
    ),
  );
  refresh();
  return { success: true };
}

// ---------------------------------------------------------------------------
// Variações dos produtos (KAN-96)
// ---------------------------------------------------------------------------

function variantValues(formData: FormData) {
  return {
    name: text(formData, "name"),
    sku: text(formData, "sku"),
    price: text(formData, "price"),
    weight: text(formData, "weight"),
    size: text(formData, "size"),
    flavor: text(formData, "flavor"),
  };
}

export async function saveVariant(
  productId: string,
  variantId: string | null,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = variantValues(formData);
  const parsed = variantSchema.safeParse({
    ...values,
    priceCents: values.price,
    weightGrams: values.weight,
    active: formData.get("active") === "on",
  });
  if (!parsed.success) {
    // Os erros vêm com o nome do campo do banco; o formulário usa price e weight.
    const { priceCents, weightGrams, ...errors } = fieldErrors(parsed.error);
    return { errors: { ...errors, price: priceCents, weight: weightGrams }, values };
  }

  try {
    if (variantId) {
      await prisma.productVariant.update({
        where: { id: variantId, productId },
        data: { ...parsed.data, attributes: parsed.data.attributes ?? Prisma.DbNull },
      });
    } else {
      // Toda variação nasce com saldo zero na loja e no abrigo (o controle vem na KAN-97).
      await prisma.productVariant.create({
        data: {
          ...parsed.data,
          productId,
          stockLevels: { create: [{ location: "STORE" }, { location: "SHELTER" }] },
        },
      });
    }
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      return { errors: { sku: ["Já existe uma variação com este SKU."] }, values };
    }
    throw error;
  }

  revalidatePath(`/admin/produtos/${productId}`);
  if (variantId) redirect(`/admin/produtos/${productId}`);
  return { success: true, message: `Variação "${parsed.data.name}" criada.` };
}

export async function deleteVariant(variantId: string): Promise<FormState> {
  await requireAdmin();
  try {
    await prisma.productVariant.delete({ where: { id: variantId } });
  } catch (error) {
    if (isPrismaError(error, "P2003")) {
      return {
        message:
          "Esta variação já foi vendida ou teve estoque movimentado. Desative-a em vez de excluir.",
      };
    }
    throw error;
  }
  refresh();
  return { success: true };
}
