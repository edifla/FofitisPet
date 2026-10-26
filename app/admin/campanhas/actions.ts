"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/app/generated/prisma/client";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { campaignSchema, fieldErrors, type FormState } from "@/lib/validation/campaign";

// Campanhas de ração no admin (KAN-42).

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "");

export async function saveCampaign(
  campaignId: string | null,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = {
    title: text(formData, "title"),
    slug: text(formData, "slug"),
    description: text(formData, "description"),
    goal: text(formData, "goal"),
    species: text(formData, "species"),
    startsAt: text(formData, "startsAt"),
    endsAt: text(formData, "endsAt"),
    active: formData.get("active") === "on" ? "on" : "",
  };
  const parsed = campaignSchema.safeParse({ ...values, active: values.active === "on" });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  try {
    if (campaignId) {
      const updated = await prisma.campaign.updateMany({
        where: { id: campaignId },
        data: parsed.data,
      });
      if (updated.count === 0) return { message: "Campanha não encontrada.", values };
    } else {
      await prisma.campaign.create({ data: parsed.data });
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { slug: ["Já existe uma campanha com este endereço (slug)."] }, values };
    }
    throw error;
  }
  revalidatePath("/admin/campanhas");
  redirect("/admin/campanhas");
}

export async function deleteCampaign(campaignId: string): Promise<FormState> {
  await requireAdmin();
  await prisma.campaign.deleteMany({ where: { id: campaignId } });
  revalidatePath("/admin/campanhas");
  redirect("/admin/campanhas");
}
