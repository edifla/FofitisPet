import type {
  AnimalSex,
  AnimalSize,
  AnimalStatus,
  FeedbackKind,
  FeedbackPriority,
  FeedbackStatus,
  HousingType,
  OrderStatus,
  Species,
  StockLocation,
  StockMovementType,
  Temperament,
} from "@/app/generated/prisma/client";

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

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Aguardando pagamento",
  PAID: "Pagamento aprovado",
  PREPARING: "Em separação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
  REFUNDED: "Reembolsado",
};

// Adoção (KAN-36)
export const animalSizeLabels: Record<AnimalSize, string> = {
  SMALL: "Pequeno",
  MEDIUM: "Médio",
  LARGE: "Grande",
};

export const animalSexLabels: Record<AnimalSex, string> = {
  MALE: "Macho",
  FEMALE: "Fêmea",
};

export const animalStatusLabels: Record<AnimalStatus, string> = {
  AVAILABLE: "Disponível para adoção",
  RESERVED: "Reservado",
  ADOPTED: "Adotado",
  UNAVAILABLE: "Fora da listagem",
};

export const temperamentLabels: Record<Temperament, string> = {
  CALM: "Calmo",
  PLAYFUL: "Brincalhão",
  ENERGETIC: "Cheio de energia",
  SHY: "Tímido",
  AFFECTIONATE: "Carinhoso",
  INDEPENDENT: "Independente",
  GOOD_WITH_KIDS: "Se dá bem com crianças",
  GOOD_WITH_DOGS: "Se dá bem com cães",
  GOOD_WITH_CATS: "Se dá bem com gatos",
};

export const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

// Espécie de um animal só, no singular (KAN-37).
export const animalSpeciesLabels: Record<Species, string> = {
  DOG: "Cão",
  CAT: "Gato",
  BIRD: "Pássaro",
  FISH: "Peixe",
  SMALL_PET: "Pequeno pet",
  OTHER: "Outro",
};

// Formulário de interesse em adoção (KAN-39).
export const housingTypeLabels: Record<HousingType, string> = {
  HOUSE: "Casa",
  APARTMENT: "Apartamento",
  FARM: "Chácara ou sítio",
  OTHER: "Outro",
};

// Feedback do beta (KAN-52).
export const feedbackKindLabels: Record<FeedbackKind, string> = {
  PROBLEM: "Problema",
  SUGGESTION: "Sugestão",
  PRAISE: "Elogio",
  OTHER: "Outro",
};

export const feedbackStatusLabels: Record<FeedbackStatus, string> = {
  NEW: "Novo",
  PLANNED: "Planejado",
  DONE: "Resolvido",
  DISCARDED: "Descartado",
};

export const feedbackPriorityLabels: Record<FeedbackPriority, string> = {
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
};
