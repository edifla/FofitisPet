"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form/field";
import { uploadTransparencyPhotos } from "./actions";

export function PhotoUploadForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState(uploadTransparencyPhotos, undefined);
  const values = state?.success ? undefined : state?.values;
  return (
    <form
      key={state?.success ? state.message : "form"}
      action={action}
      className="flex max-w-xl flex-col gap-3"
      noValidate
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="images" className="text-sm font-medium">
          Fotos
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
        label="Legenda"
        name="caption"
        required
        placeholder="Entrega de ração de outubro"
        hint="Aparece na página e é lida por leitores de tela. Evite mostrar rostos sem autorização."
        defaultValue={values?.caption}
        errors={state?.errors?.caption}
      />
      <Field
        label="Data da foto"
        name="takenOn"
        type="date"
        max={today}
        defaultValue={values?.takenOn ?? today}
        errors={state?.errors?.takenOn}
      />
      <FormMessage message={state?.message} tone={state?.success ? "success" : "error"} />
      <div>
        <SubmitButton pending={pending}>Publicar fotos</SubmitButton>
      </div>
    </form>
  );
}
