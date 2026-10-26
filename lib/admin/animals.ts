import "server-only";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

// Leituras do cadastro de animais no admin (KAN-36).

export async function listAnimals() {
  await requireAdmin();
  return prisma.animal.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      species: true,
      size: true,
      sex: true,
      status: true,
      images: {
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
        take: 1,
        select: { url: true, alt: true },
      },
      _count: { select: { images: true, vaccinations: true } },
    },
  });
}

export async function getAnimal(animalId: string) {
  await requireAdmin();
  return prisma.animal.findUnique({
    where: { id: animalId },
    include: {
      images: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] },
      vaccinations: { orderBy: { appliedAt: "desc" } },
    },
  });
}
