import * as z from "zod";
import { nameSchema, slugInput, SPECIES, withSlug } from "./catalog";

export { fieldErrors, type FormState } from "./form";

// Cadastro de animais do abrigo (KAN-36).

const SIZES = ["SMALL", "MEDIUM", "LARGE"] as const;
const SEXES = ["MALE", "FEMALE"] as const;
const STATUSES = ["AVAILABLE", "RESERVED", "ADOPTED", "UNAVAILABLE"] as const;
export const TEMPERAMENTS = [
  "CALM",
  "PLAYFUL",
  "ENERGETIC",
  "SHY",
  "AFFECTIONATE",
  "INDEPENDENT",
  "GOOD_WITH_KIDS",
  "GOOD_WITH_DOGS",
  "GOOD_WITH_CATS",
] as const;

// "AAAA-MM-DD" do campo de data, gravado como data (sem hora) no banco.
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Informe a data." })
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), { error: "Data inválida." })
  .transform((value) => new Date(`${value}T00:00:00Z`));

const notFuture = (date: Date) => date.getTime() <= Date.now();

const optionalPastDate = z
  .union([
    z.literal("").transform(() => null),
    isoDate.refine(notFuture, { error: "A data não pode estar no futuro." }),
  ])
  .optional()
  .transform((value) => value ?? null);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Use no máximo ${max} caracteres.` })
    .transform((value) => value || null);

const enumField = <T extends readonly [string, ...string[]]>(values: T, message: string) =>
  z.enum(values, { error: message });

export const animalSchema = z
  .object({
    name: nameSchema,
    slug: slugInput,
    species: enumField(SPECIES, "Escolha a espécie."),
    size: enumField(SIZES, "Escolha o porte."),
    sex: enumField(SEXES, "Escolha o sexo."),
    birthDate: optionalPastDate,
    temperament: z.array(z.enum(TEMPERAMENTS)).max(TEMPERAMENTS.length),
    story: z
      .string()
      .trim()
      .min(20, { error: "Conte a história do animal com pelo menos 20 caracteres." })
      .max(5000, { error: "Use no máximo 5000 caracteres." }),
    healthNotes: optionalText(2000),
    specialNeeds: optionalText(1000),
    neutered: z.boolean(),
    dewormed: z.boolean(),
    status: enumField(STATUSES, "Escolha a situação."),
    arrivedAt: optionalPastDate,
  })
  .transform(withSlug);

export const vaccinationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { error: "Informe a vacina, ex.: V10." })
      .max(60, { error: "Use no máximo 60 caracteres." }),
    appliedAt: isoDate.refine(notFuture, { error: "A data não pode estar no futuro." }),
    nextDoseAt: z
      .union([z.literal("").transform(() => null), isoDate])
      .optional()
      .transform((value) => value ?? null),
  })
  .refine((data) => !data.nextDoseAt || data.nextDoseAt > data.appliedAt, {
    path: ["nextDoseAt"],
    error: "A próxima dose precisa ser depois da aplicação.",
  });
