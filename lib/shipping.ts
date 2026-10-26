// Frete simulado para desenvolvimento (KAN-27). No Épico 8 (KAN-56) esta função passa a chamar
// um serviço real (Melhor Envio ou Correios); quem usa só depende de quoteShipping e dos tipos.

export type ShippingOption = {
  id: "economica" | "expressa";
  name: string;
  priceCents: number;
  // Prazo em dias úteis depois da confirmação do pagamento.
  days: number;
};

export type ShippingQuote = {
  zipCode: string;
  billedKg: number;
  options: ShippingOption[];
  // Quanto falta para o frete grátis da Econômica (0 se já tem).
  missingForFreeCents: number;
};

// Compras a partir deste valor têm a Econômica grátis.
export const FREE_SHIPPING_FROM_CENTS = 19_900;
// Peso usado para variações sem peso cadastrado.
export const DEFAULT_ITEM_GRAMS = 500;

// Faixas pelo primeiro dígito do CEP (aproximação das regiões dos Correios).
const zones = {
  sp: { base: 1290, perKg: 150, days: 3 },
  sudesteSul: { base: 1690, perKg: 220, days: 5 },
  centroNordeste: { base: 2290, perKg: 320, days: 8 },
  norte: { base: 2990, perKg: 420, days: 12 },
} as const;

const zoneByFirstDigit: Record<string, keyof typeof zones> = {
  "0": "sp",
  "1": "sp",
  "2": "sudesteSul", // RJ, ES
  "3": "sudesteSul", // MG
  "4": "centroNordeste", // BA, SE
  "5": "centroNordeste", // PE, AL, PB, RN
  "6": "norte", // CE, PI, MA, PA, AM, AP, RR, AC
  "7": "centroNordeste", // DF, GO, TO, MT, MS, RO
  "8": "sudesteSul", // PR, SC
  "9": "sudesteSul", // RS
};

export type ShippingItem = { weightGrams: number | null; quantity: number };

export function quoteShipping({
  zipCode,
  items,
  subtotalCents,
}: {
  zipCode: string;
  items: ShippingItem[];
  subtotalCents: number;
}): ShippingQuote | null {
  const digits = zipCode.replace(/\D/g, "");
  if (digits.length !== 8 || items.length === 0) return null;
  const zone = zones[zoneByFirstDigit[digits[0]]];

  const grams = items.reduce(
    (sum, item) => sum + (item.weightGrams ?? DEFAULT_ITEM_GRAMS) * item.quantity,
    0,
  );
  // Cobrado por kg iniciado, no mínimo 1 kg.
  const billedKg = Math.max(1, Math.ceil(grams / 1000));
  const economyPrice = zone.base + zone.perKg * (billedKg - 1);
  const freeEconomy = subtotalCents >= FREE_SHIPPING_FROM_CENTS;

  return {
    zipCode: digits,
    billedKg,
    missingForFreeCents: Math.max(0, FREE_SHIPPING_FROM_CENTS - subtotalCents),
    options: [
      {
        id: "economica",
        name: "Econômica",
        priceCents: freeEconomy ? 0 : economyPrice,
        days: zone.days,
      },
      {
        id: "expressa",
        name: "Expressa",
        priceCents: Math.round((economyPrice * 1.8) / 10) * 10,
        days: Math.max(1, Math.ceil(zone.days / 2.5)),
      },
    ],
  };
}
