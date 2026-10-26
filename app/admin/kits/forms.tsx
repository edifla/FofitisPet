"use client";

import { useActionState } from "react";
import {
  CheckboxField,
  Field,
  FormMessage,
  SelectField,
  SubmitButton,
  TextAreaField,
} from "@/components/form/field";
import { addKitItem, saveKit } from "./actions";

export type KitFormData = {
  id: string;
  name: string;
  slug: string;
  description: string;
  position: string;
  active: boolean;
};

type TextField = Exclude<keyof KitFormData, "id" | "active">;

// Dados do kit de doação (KAN-43).
export function KitForm({ kit }: { kit?: KitFormData }) {
  const [state, action, pending] = useActionState(saveKit.bind(null, kit?.id ?? null), undefined);
  const value = (name: TextField) => {
    const typed = state?.values?.[name];
    if (typed !== undefined) return String(typed);
    return kit?.[name] ?? (name === "position" ? "0" : "");
  };
  const active = state?.values ? state.values.active === "on" : (kit?.active ?? true);

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nome do kit"
          name="name"
          required
          placeholder="1 kg de ração"
          defaultValue={value("name")}
          errors={state?.errors?.name}
        />
        <Field
          label="Slug"
          name="slug"
          defaultValue={value("slug")}
          hint="Em branco, é gerado a partir do nome."
          errors={state?.errors?.slug}
        />
      </div>
      <TextAreaField
        label="Descrição"
        name="description"
        rows={3}
        required
        defaultValue={value("description")}
        errors={state?.errors?.description}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Ordem"
          name="position"
          type="number"
          min={0}
          hint="Menores aparecem primeiro."
          defaultValue={value("position")}
          errors={state?.errors?.position}
        />
        <CheckboxField label="Kit ativo (aparece em /doar)" name="active" defaultChecked={active} />
      </div>
      <FormMessage message={state?.message} tone={state?.success ? "success" : "error"} />
      <div>
        <SubmitButton pending={pending}>{kit ? "Salvar kit" : "Criar kit"}</SubmitButton>
      </div>
    </form>
  );
}

export function KitItemForm({
  kitId,
  options,
}: {
  kitId: string;
  options: { value: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(addKitItem.bind(null, kitId), undefined);
  return (
    <form
      key={state?.success ? state.message : "form"}
      action={action}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      noValidate
    >
      <div className="flex-1">
        <SelectField
          label="Produto"
          name="variantId"
          placeholder="Escolha um produto doável"
          options={options}
          defaultValue={state?.success ? "" : String(state?.values?.variantId ?? "")}
          errors={state?.errors?.variantId}
        />
      </div>
      <div className="sm:w-28">
        <Field
          label="Quantidade"
          name="quantity"
          type="number"
          min={1}
          defaultValue={state?.success ? "1" : String(state?.values?.quantity ?? "1")}
          errors={state?.errors?.quantity}
        />
      </div>
      <SubmitButton pending={pending}>Adicionar</SubmitButton>
      <FormMessage message={state?.message} tone={state?.success ? "success" : "error"} />
    </form>
  );
}
