"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckboxField, Field, FormMessage, SubmitButton } from "@/components/form/field";
import { saveVariant } from "../../actions";

export type VariantFormValues = {
  id: string;
  name: string;
  sku: string;
  price: string;
  weight: string;
  size: string;
  flavor: string;
  active: boolean;
};

type TextField = Exclude<keyof VariantFormValues, "id" | "active">;

export function VariantForm({
  productId,
  variant,
}: {
  productId: string;
  variant?: VariantFormValues;
}) {
  const [state, action, pending] = useActionState(
    saveVariant.bind(null, productId, variant?.id ?? null),
    undefined,
  );
  // Depois de criar, o formulário volta vazio para a próxima variação.
  const typed = state?.success ? undefined : state?.values;
  const value = (name: TextField) => String(typed?.[name] ?? variant?.[name] ?? "");

  return (
    <form
      key={state?.success ? state.message : "form"}
      action={action}
      className="flex flex-col gap-4"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nome da variação"
          name="name"
          required
          defaultValue={value("name")}
          hint="Ex.: 15 kg, Frango, Tamanho M."
          errors={state?.errors?.name}
        />
        <Field
          label="SKU"
          name="sku"
          required
          defaultValue={value("sku")}
          hint="Código único da variação."
          errors={state?.errors?.sku}
        />
        <Field
          label="Preço (R$)"
          name="price"
          inputMode="decimal"
          required
          placeholder="199,90"
          defaultValue={value("price")}
          errors={state?.errors?.price}
        />
        <Field
          label="Peso (kg)"
          name="weight"
          inputMode="decimal"
          placeholder="15"
          defaultValue={value("weight")}
          hint="Usado no frete e nas campanhas de ração."
          errors={state?.errors?.weight}
        />
        <Field
          label="Tamanho (opcional)"
          name="size"
          defaultValue={value("size")}
          errors={state?.errors?.size}
        />
        <Field
          label="Sabor (opcional)"
          name="flavor"
          defaultValue={value("flavor")}
          errors={state?.errors?.flavor}
        />
      </div>
      <CheckboxField
        label="Variação ativa"
        name="active"
        defaultChecked={variant?.active ?? true}
      />
      <FormMessage message={state?.message} tone={state?.success ? "success" : "error"} />
      <div className="flex items-center gap-4">
        <SubmitButton pending={pending}>
          {variant ? "Salvar variação" : "Adicionar variação"}
        </SubmitButton>
        {variant && (
          <Link href={`/admin/produtos/${productId}`} className="text-sm underline">
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
