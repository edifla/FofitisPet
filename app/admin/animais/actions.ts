"use server";

import { randomUUID } from "node:crypto";
import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/app/generated/prisma/client";
import { requireAdmin } from "@/lib/dal";
import { readImageUploads } from "@/lib/images";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import {
  animalSchema,
  fieldErrors,
  type FormState,
  vaccinationSchema,
} from "@/lib/validation/animal";

// Cadastro de animais do abrigo no admin (KAN-36).

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "");

const isPrismaError = (error: unknown, code: string) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;

function animalValues(formData: FormData) {
  return {
    name: text(formData, "name"),
    slug: text(formData, "slug"),
    species: text(formData, "species"),
    size: text(formData, "size"),
    sex: text(formData, "sex"),
    birthDate: text(formData, "birthDate"),
    temperament: formData.getAll("temperament").map(String),
    story: text(formData, "story"),
    healthNotes: text(formData, "healthNotes"),
    specialNeeds: text(formData, "specialNeeds"),
    status: text(formData, "status"),
    arrivedAt: text(formData, "arrivedAt"),
  };
}

export async function saveAnimal(
  animalId: string | null,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = animalValues(formData);
  const parsed = animalSchema.safeParse({
    ...values,
    neutered: formData.get("neutered") === "on",
    dewormed: formData.get("dewormed") === "on",
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const data = parsed.data;
  let id = animalId;
  try {
    if (animalId) {
      const current = await prisma.animal.findUnique({
        where: { id: animalId },
        select: { status: true, adoptedAt: true },
      });
      if (!current) return { message: "Animal não encontrado." };
      // A data de adoção é marcada quando o status passa a "Adotado".
      const adoptedAt = data.status === "ADOPTED" ? (current.adoptedAt ?? new Date()) : null;
      await prisma.animal.update({ where: { id: animalId }, data: { ...data, adoptedAt } });
    } else {
      const created = await prisma.animal.create({
        data: { ...data, adoptedAt: data.status === "ADOPTED" ? new Date() : null },
        select: { id: true },
      });
      id = created.id;
    }
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      return { errors: { slug: ["Já existe um animal com este endereço (slug)."] }, values };
    }
    throw error;
  }

  revalidatePath("/admin/animais");
  // Depois de criar, segue para a página do animal, onde entram fotos e vacinas.
  redirect(animalId ? "/admin/animais" : `/admin/animais/${id}`);
}

export async function deleteAnimal(animalId: string): Promise<FormState> {
  await requireAdmin();
  const images = await prisma.animalImage.findMany({
    where: { animalId },
    select: { storageKey: true },
  });
  try {
    await prisma.animal.delete({ where: { id: animalId } });
  } catch (error) {
    // Pedidos de adoção fazem parte do histórico do abrigo.
    if (isPrismaError(error, "P2003")) {
      return {
        message:
          'Este animal já tem pedidos de adoção. Mude a situação para "Fora da listagem" em vez de excluir.',
      };
    }
    throw error;
  }
  await Promise.all(images.map((image) => storage.remove(image.storageKey)));
  revalidatePath("/admin/animais");
  redirect("/admin/animais");
}

// ---------------------------------------------------------------------------
// Fotos (KAN-112)
// ---------------------------------------------------------------------------

export async function uploadAnimalImages(
  animalId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const animal = await prisma.animal.findUnique({
    where: { id: animalId },
    select: { name: true, _count: { select: { images: true } } },
  });
  if (!animal) return { message: "Animal não encontrado." };

  const upload = await readImageUploads(formData, "images");
  if ("message" in upload) return upload;

  const alt = text(formData, "alt").trim().slice(0, 200) || `Foto de ${animal.name}`;
  let position = animal._count.images;
  for (const { bytes, ext } of upload.images) {
    const storageKey = `animais/${animalId}/${randomUUID()}.${ext}`;
    await storage.save(storageKey, bytes);
    await prisma.animalImage.create({
      data: { animalId, storageKey, url: storage.publicUrl(storageKey), alt, position: position++ },
    });
  }
  refresh();
  return { success: true, message: `${upload.images.length} foto(s) enviada(s).` };
}

export async function deleteAnimalImage(imageId: string): Promise<FormState> {
  await requireAdmin();
  const image = await prisma.animalImage.delete({
    where: { id: imageId },
    select: { storageKey: true },
  });
  await storage.remove(image.storageKey);
  refresh();
  return { success: true };
}

// Troca a foto de lugar com a vizinha. A primeira é a capa do animal na listagem.
export async function moveAnimalImage(imageId: string, direction: -1 | 1): Promise<FormState> {
  await requireAdmin();
  const image = await prisma.animalImage.findUnique({
    where: { id: imageId },
    select: { animalId: true },
  });
  if (!image) return { message: "Foto não encontrada." };

  const images = await prisma.animalImage.findMany({
    where: { animalId: image.animalId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const from = images.findIndex((i) => i.id === imageId);
  const to = from + direction;
  if (to < 0 || to >= images.length) return { success: true };

  [images[from], images[to]] = [images[to], images[from]];
  await prisma.$transaction(
    images.map((i, position) =>
      prisma.animalImage.update({ where: { id: i.id }, data: { position } }),
    ),
  );
  refresh();
  return { success: true };
}

// ---------------------------------------------------------------------------
// Vacinas (KAN-113)
// ---------------------------------------------------------------------------

export async function addVaccination(
  animalId: string,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const values = {
    name: text(formData, "name"),
    appliedAt: text(formData, "appliedAt"),
    nextDoseAt: text(formData, "nextDoseAt"),
  };
  const parsed = vaccinationSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  try {
    await prisma.vaccination.create({ data: { animalId, ...parsed.data } });
  } catch (error) {
    if (isPrismaError(error, "P2003")) return { message: "Animal não encontrado." };
    throw error;
  }
  refresh();
  return { success: true, message: `Vacina ${parsed.data.name} registrada.` };
}

export async function deleteVaccination(vaccinationId: string): Promise<FormState> {
  await requireAdmin();
  await prisma.vaccination.deleteMany({ where: { id: vaccinationId } });
  refresh();
  return { success: true };
}
