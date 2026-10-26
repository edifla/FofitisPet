import type { Species, StockLocation, StockMovementType } from "@/app/generated/prisma/client";

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

export const stockLocationLabels: Record<StockLocation, string> = {
  STORE: "Loja",
  SHELTER: "Abrigo",
};

export const stockMovementLabels: Record<StockMovementType, string> = {
  RESTOCK: "Entrada de mercadoria",
  ADJUSTMENT: "Ajuste de inventário",
  SALE: "Venda",
  DONATION_TRANSFER: "Compra para o abrigo",
  SHELTER_CONSUMPTION: "Consumo do abrigo",
  RETURN: "Devolução",
};
