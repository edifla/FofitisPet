"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form/field";
import { createBrand } from "../actions";

export function BrandForm() {
  const [state, action, pending] = useActionState(createBrand, undefined);
  // Depois de criar, o formulário volta vazio; com erro, mantém o que foi digitado.
  const values = state?.success ? undefined : state?.values;

  return (
    <form action={action} className="flex max-w-xl flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nome da marca"
          name="name"
          required
          defaultValue={values?.name}
          errors={state?.errors?.name}
        />
        <Field
          label="Slug (opcional)"
          name="slug"
          defaultValue={values?.slug}
          errors={state?.errors?.slug}
        />
      </div>
      <FormMessage message={state?.message} tone={state?.success ? "success" : "error"} />
      <div>
        <SubmitButton pending={pending}>Adicionar marca</SubmitButton>
      </div>
    </form>
  );
}
