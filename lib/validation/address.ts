import * as z from "zod";

export { fieldErrors, type FormState } from "./form";

export const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

const required = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, { error: `Informe ${label}.` })
    .max(max, { error: `Use no máximo ${max} caracteres.` });

export const addressSchema = z.object({
  recipientName: required("quem vai receber", 100),
  // Aceita "12345-678" ou "12345678"; guarda só os números.
  zipCode: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 8, { error: "Informe um CEP com 8 números." }),
  street: required("a rua", 150),
  number: required("o número (ou S/N)", 20),
  complement: z
    .string()
    .trim()
    .max(80, { error: "Use no máximo 80 caracteres." })
    .transform((value) => value || null),
  neighborhood: required("o bairro", 80),
  city: required("a cidade", 80),
  state: z.enum(UFS, { error: "Escolha a UF." }),
  label: z
    .string()
    .trim()
    .max(30, { error: "Use no máximo 30 caracteres." })
    .transform((value) => value || null),
});

export function formatZipCode(zipCode: string) {
  return `${zipCode.slice(0, 5)}-${zipCode.slice(5)}`;
}
