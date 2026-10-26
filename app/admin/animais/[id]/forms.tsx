"use client";

import { useActionState, useTransition } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form/field";
import type { FormState } from "@/lib/validation/form";
import { addVaccination, uploadAnimalImages } from "../actions";

// Envio de fotos do animal (KAN-112).
export function AnimalImageUploadForm({ animalId }: { animalId: string }) {
  const [state, action, pending] = useActionState(
    uploadAnimalImages.bind(null, animalId),
    undefined,
  );
  return (
    <form key={state?.message} action={action} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor="images" className="text-sm font-medium">
          Adicionar fotos
        </label>
        <input
          id="images"
          name="images"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="text-sm"
        />
        <p className="text-sm text-zinc-500">JPG, PNG ou WebP, até 5 MB cada, 6 por vez.</p>
      </div>
      <Field
        label="Descrição das fotos (opcional)"
        name="alt"
        hint='Lida por leitores de tela. Em branco, usa "Foto de <nome>".'
      />
      <FormMessage message={state?.message} tone={state?.success ? "success" : "error"} />
      <div>
        <SubmitButton pending={pending}>Enviar fotos</SubmitButton>
      </div>
    </form>
  );
}

export function MovePhotoButtons({
  move,
  isFirst,
  isLast,
}: {
  move: (direction: -1 | 1) => Promise<FormState>;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const go = (direction: -1 | 1) =>
    startTransition(async () => {
      await move(direction);
    });
  return (
    <span className="flex gap-2">
      <button
        type="button"
        disabled={pending || isFirst}
        onClick={() => go(-1)}
        aria-label="Mover para a esquerda"
        className="rounded border border-zinc-300 px-2 text-sm disabled:opacity-40 dark:border-zinc-700"
      >
        ←
      </button>
      <button
        type="button"
        disabled={pending || isLast}
        onClick={() => go(1)}
        aria-label="Mover para a direita"
        className="rounded border border-zinc-300 px-2 text-sm disabled:opacity-40 dark:border-zinc-700"
      >
        →
      </button>
    </span>
  );
}

// Registro de vacina (KAN-113).
export function VaccinationForm({ animalId, today }: { animalId: string; today: string }) {
  const [state, action, pending] = useActionState(addVaccination.bind(null, animalId), undefined);
  const values = state?.success ? undefined : state?.values;
  const value = (name: string) => (values?.[name] as string | undefined) ?? "";

  return (
    <form key={state?.message} action={action} className="flex flex-col gap-3" noValidate>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Vacina"
          name="name"
          placeholder="Ex.: V10"
          required
          defaultValue={value("name")}
          errors={state?.errors?.name}
        />
        <Field
          label="Aplicada em"
          name="appliedAt"
          type="date"
          max={today}
          required
          defaultValue={value("appliedAt") || today}
          errors={state?.errors?.appliedAt}
        />
        <Field
          label="Próxima dose (opcional)"
          name="nextDoseAt"
          type="date"
          defaultValue={value("nextDoseAt")}
          errors={state?.errors?.nextDoseAt}
        />
      </div>
      <FormMessage message={state?.message} tone={state?.success ? "success" : "error"} />
      <div>
        <SubmitButton pending={pending}>Registrar vacina</SubmitButton>
      </div>
    </form>
  );
}
