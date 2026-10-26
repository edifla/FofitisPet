"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form/field";
import { uploadProductImages } from "../../actions";

export function ImageUploadForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState(
    uploadProductImages.bind(null, productId),
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor="images" className="text-sm font-medium">
          Adicionar imagens
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
        label="Descrição das imagens (opcional)"
        name="alt"
        hint="Lida por leitores de tela. Se ficar em branco, usa o nome do produto."
      />
      <FormMessage message={state?.message} tone={state?.success ? "success" : "error"} />
      <div>
        <SubmitButton pending={pending}>Enviar imagens</SubmitButton>
      </div>
    </form>
  );
}
