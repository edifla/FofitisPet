"use server";

import { randomUUID } from "node:crypto";
import { refresh } from "next/cache";
import * as z from "zod";
import { requireAdmin } from "@/lib/dal";
import { readImageUploads } from "@/lib/images";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { fieldErrors, type FormState } from "@/lib/validation/form";

// Fotos da página de transparência (KAN-44).

const photoSchema = z.object({
  caption: z
    .string()
    .trim()
    .min(3, { error: "Escreva uma legenda, ex.: Entrega de ração de outubro." })
    .max(200, { error: "Use no máximo 200 caracteres." }),
  takenOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Informe a data da foto." })
    .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), {
      error: "Data inválida.",
    })
    .transform((value) => new Date(`${value}T00:00:00Z`))
    .refine((value) => value.getTime() <= Date.now(), {
      error: "A data não pode estar no futuro.",
    }),
});

export async function uploadTransparencyPhotos(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = {
    caption: String(formData.get("caption") ?? ""),
    takenOn: String(formData.get("takenOn") ?? ""),
  };
  const parsed = photoSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const upload = await readImageUploads(formData, "images");
  if ("message" in upload) return { ...upload, values };

  for (const { bytes, ext } of upload.images) {
    const storageKey = `transparencia/${randomUUID()}.${ext}`;
    await storage.save(storageKey, bytes);
    await prisma.transparencyPhoto.create({
      data: { storageKey, url: storage.publicUrl(storageKey), ...parsed.data },
    });
  }
  refresh();
  return { success: true, message: `${upload.images.length} foto(s) publicada(s).` };
}

export async function deleteTransparencyPhoto(photoId: string): Promise<FormState> {
  await requireAdmin();
  const photo = await prisma.transparencyPhoto.findUnique({
    where: { id: photoId },
    select: { storageKey: true },
  });
  if (!photo) return { message: "Foto não encontrada." };
  await prisma.transparencyPhoto.delete({ where: { id: photoId } });
  await storage.remove(photo.storageKey);
  refresh();
  return { success: true };
}
