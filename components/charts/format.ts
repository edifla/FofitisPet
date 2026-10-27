import { formatBRL } from "@/lib/money";

// Formatação dos valores dos gráficos, usada no servidor e no navegador.

export type ChartFormat = "number" | "brl";
export type ChartTone = "brand" | "donate" | "adopt";

const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat("pt-BR");

export function formatValue(value: number, format: ChartFormat) {
  return format === "brl" ? formatBRL(value) : integer.format(value);
}

export function formatTick(value: number, format: ChartFormat) {
  return format === "brl" ? `R$ ${compact.format(value / 100)}` : compact.format(value);
}
