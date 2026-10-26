// Dinheiro é guardado em centavos (Int). Estas funções convertem de/para o formato brasileiro.

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(cents: number): string {
  return brl.format(cents / 100);
}

// "199,90", "199.90", "1.234,56", "R$ 10" -> centavos. Devolve null se não for um valor válido.
export function parseBRL(input: string): number | null {
  const cleaned = input.replace(/R\$|\s/g, "");
  let normalized: string;
  if (/^\d{1,3}(\.\d{3})*,\d{1,2}$|^\d+,\d{1,2}$/.test(cleaned)) {
    // "1.234,56": ponto de milhar, vírgula decimal.
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    // "1.234": no Brasil, o ponto com três dígitos depois é milhar.
    normalized = cleaned.replace(/\./g, "");
  } else if (/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    // "199.90" ou "10": ponto decimal.
    normalized = cleaned;
  } else {
    return null;
  }
  const value = Math.round(Number(normalized) * 100);
  return Number.isFinite(value) ? value : null;
}

// Centavos -> "199,90" para preencher campos de formulário.
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

// Peso: o admin digita em kg ("15", "0,5"), o banco guarda gramas.
export function parseKg(input: string): number | null {
  const value = Number(input.trim().replace(",", "."));
  return Number.isFinite(value) && value > 0 ? Math.round(value * 1000) : null;
}

export function gramsToInput(grams: number | null): string {
  return grams === null ? "" : String(grams / 1000).replace(".", ",");
}

export function formatWeight(grams: number | null): string {
  if (grams === null) return "—";
  return grams >= 1000 ? `${String(grams / 1000).replace(".", ",")} kg` : `${grams} g`;
}
