"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/app/generated/prisma/client";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { fieldErrors, type FormState, kitItemSchema, kitSchema } from "@/lib/validation/kit";

// Kits de doação no admin (KAN-43).

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "");

const isPrismaError = (error: unknown, code: string) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;

export async function saveKit(
  kitId: string | null,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = {
    name: text(formData, "name"),
    slug: text(formData, "slug"),
    description: text(formData, "description"),
    position: text(formData, "position") || "0",
    active: formData.get("active") === "on" ? "on" : "",
  };
  const parsed = kitSchema.safeParse({ ...values, active: values.active === "on" });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  let id = kitId;
  try {
    if (kitId) {
      const updated = await prisma.donationKit.updateMany({
        where: { id: kitId },
        data: parsed.data,
      });
      if (updated.count === 0) return { message: "Kit não encontrado.", values };
    } else {
      id = (await prisma.donationKit.create({ data: parsed.data, select: { id: true } })).id;
    }
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      return { errors: { slug: ["Já existe um kit com este endereço (slug)."] }, values };
    }
    throw error;
  }
  revalidatePath("/admin/kits");
  // Depois de criar, segue para o kit, onde entram os itens.
  if (!kitId) redirect(`/admin/kits/${id}`);
  refresh();
  return { success: true, message: "Kit salvo." };
}

export async function deleteKit(kitId: string): Promise<FormState> {
  await requireAdmin();
  await prisma.donationKit.deleteMany({ where: { id: kitId } });
  revalidatePath("/admin/kits");
  redirect("/admin/kits");
}

export async function addKitItem(
  kitId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = { variantId: text(formData, "variantId"), quantity: text(formData, "quantity") };
  const parsed = kitItemSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const { variantId, quantity } = parsed.data;

  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, product: { donationEligible: true } },
    select: { id: true },
  });
  if (!variant) {
    return { errors: { variantId: ["Escolha um produto que pode ser doado."] }, values };
  }
  try {
    await prisma.donationKitItem.upsert({
      where: { kitId_variantId: { kitId, variantId } },
      create: { kitId, variantId, quantity },
      update: { quantity },
    });
  } catch (error) {
    // Kit apagado enquanto a tela estava aberta.
    if (isPrismaError(error, "P2003")) return { message: "Kit não encontrado.", values };
    throw error;
  }
  refresh();
  return { success: true, message: "Item salvo no kit." };
}

export async function removeKitItem(itemId: string): Promise<FormState> {
  await requireAdmin();
  await prisma.donationKitItem.deleteMany({ where: { id: itemId } });
  refresh();
  return { success: true };
}
