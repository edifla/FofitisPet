import * as z from "zod";

export { fieldErrors, type FormState } from "./form";

export const MAX_INSTALLMENTS = 3;

// Dígito verificador do número do cartão (algoritmo de Luhn).
export function luhnValid(digits: string) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export function cardBrand(digits: string) {
  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2[2-7]|503143)/.test(digits)) return "master";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(digits))
    return "elo";
  return "outro";
}

export const cardSchema = z
  .object({
    cardNumber: z
      .string()
      .transform((value) => value.replace(/[\s.-]/g, ""))
      .pipe(
        z
          .string()
          .regex(/^\d{13,19}$/, { error: "Informe o número do cartão." })
          .refine(luhnValid, { error: "Número do cartão inválido." }),
      ),
    holderName: z
      .string()
      .trim()
      .min(2, { error: "Informe o nome impresso no cartão." })
      .max(60, { error: "Use no máximo 60 caracteres." }),
    expiry: z
      .string()
      .trim()
      .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, { error: "Use o formato MM/AA." }),
    cvv: z
      .string()
      .trim()
      .regex(/^\d{3,4}$/, { error: "O código de segurança tem 3 ou 4 dígitos." }),
    installments: z.coerce
      .number()
      .int()
      .min(1, { error: "Escolha as parcelas." })
      .max(MAX_INSTALLMENTS, { error: "Escolha as parcelas." }),
  })
  .superRefine((card, ctx) => {
    const [month, year] = card.expiry.split("/").map(Number);
    const now = new Date();
    const current = now.getFullYear() % 100;
    if (year < current || (year === current && month < now.getMonth() + 1)) {
      ctx.addIssue({ code: "custom", path: ["expiry"], message: "Cartão vencido." });
    }
  });

export type CardInput = z.infer<typeof cardSchema>;
