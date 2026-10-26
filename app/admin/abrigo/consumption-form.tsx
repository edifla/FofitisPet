"use client";

import { useActionState } from "react";
import { Field, FormMessage, SelectField, SubmitButton } from "@/components/form/field";
import { recordConsumption } from "./actions";

type Option = { value: string; label: string };

// Registro do que foi dado aos animais (KAN-34).
export function ConsumptionForm({
  items,
  animals,
  today,
}: {
  items: Option[];
  animals: Option[];
  today: string;
}) {
  const [state, action, pending] = useActionState(recordConsumption, undefined);
  const values = state?.success ? undefined : state?.values;
  const value = (name: string) => (values?.[name] as string | undefined) ?? undefined;

  return (
    <form key={state?.message} action={action} className="flex flex-col gap-4" noValidate>
      <SelectField
        label="Item"
        name="variantId"
        options={items}
        placeholder="Escolha o item"
        defaultValue={value("variantId") ?? ""}
        errors={state?.errors?.variantId}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Quantidade"
          name="quantity"
          type="number"
          min={1}
          required
          defaultValue={value("quantity")}
          errors={state?.errors?.quantity}
        />
        <Field
          label="Data"
          name="consumedOn"
          type="date"
          max={today}
          required
          defaultValue={value("consumedOn") ?? today}
          errors={state?.errors?.consumedOn}
        />
      </div>
      <SelectField
        label="Animal (opcional)"
        name="animalId"
        options={animals}
        placeholder="Abrigo em geral"
        defaultValue={value("animalId") ?? ""}
        hint={animals.length === 0 ? "Os animais entram com o cadastro de adoção." : undefined}
        errors={state?.errors?.animalId}
      />
      <Field
        label="Observação (opcional)"
        name="note"
        placeholder="Ex.: ração do canil 2"
        defaultValue={value("note")}
        errors={state?.errors?.note}
      />
      <FormMessage message={state?.message} tone={state?.success ? "success" : "error"} />
      <div>
        <SubmitButton pending={pending}>Registrar consumo</SubmitButton>
      </div>
    </form>
  );
}
