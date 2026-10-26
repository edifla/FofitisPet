import type { Species } from "@/app/generated/prisma/client";

export const speciesLabels: Record<Species, string> = {
  DOG: "Cães",
  CAT: "Gatos",
  BIRD: "Pássaros",
  FISH: "Peixes",
  SMALL_PET: "Roedores e pequenos pets",
  OTHER: "Outros",
};

export const speciesOptions = Object.entries(speciesLabels).map(([value, label]) => ({
  value,
  label,
}));
