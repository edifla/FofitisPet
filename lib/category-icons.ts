// Ícones que o admin pode escolher para uma categoria (o desenho de cada um fica em
// components/catalog/category-icon.tsx). Sem escolha, a loja tenta adivinhar pelo slug.
export const CATEGORY_ICONS = {
  tigela: "Tigela (alimentação)",
  "racao-seca": "Saco de ração",
  "racao-umida": "Lata / sachê",
  petisco: "Ossinho (petiscos)",
  brinquedo: "Bolinha (brinquedos)",
  higiene: "Gota (higiene e banho)",
  acessorio: "Coleira (acessórios)",
  caminha: "Caminha",
  saude: "Maleta (saúde)",
  aquario: "Peixe (aquário)",
  passaro: "Pena (pássaros)",
  etiqueta: "Etiqueta (outros)",
} as const;

export type CategoryIconKey = keyof typeof CATEGORY_ICONS;
export const CATEGORY_ICON_KEYS = Object.keys(CATEGORY_ICONS) as [
  CategoryIconKey,
  ...CategoryIconKey[],
];

export function isCategoryIcon(value: unknown): value is CategoryIconKey {
  return typeof value === "string" && value in CATEGORY_ICONS;
}
