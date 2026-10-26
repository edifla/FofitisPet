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
import { speciesOptions } from "@/lib/labels";
import { saveCampaign } from "./actions";

export type CampaignFormData = {
  id: string;
  title: string;
  slug: string;
  description: string;
  goal: string;
  species: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

type TextField = Exclude<keyof CampaignFormData, "id" | "active">;

// Formulário da campanha de ração (KAN-42).
export function CampaignForm({ campaign, today }: { campaign?: CampaignFormData; today: string }) {
  const [state, action, pending] = useActionState(
    saveCampaign.bind(null, campaign?.id ?? null),
    undefined,
  );
  const value = (name: TextField) => {
    const typed = state?.values?.[name];
    if (typed !== undefined) return String(typed);
    return campaign?.[name] ?? (name === "startsAt" ? today : "");
  };
  const active = state?.values ? state.values.active === "on" : (campaign?.active ?? true);

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Título"
          name="title"
          required
          placeholder="Ração para o inverno"
          defaultValue={value("title")}
          errors={state?.errors?.title}
        />
        <Field
          label="Slug"
          name="slug"
          defaultValue={value("slug")}
          hint="Em branco, é gerado a partir do título."
          errors={state?.errors?.slug}
        />
      </div>
      <TextAreaField
        label="Descrição"
        name="description"
        rows={4}
        required
        defaultValue={value("description")}
        errors={state?.errors?.description}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Meta (kg de ração)"
          name="goal"
          inputMode="decimal"
          required
          placeholder="50"
          defaultValue={value("goal")}
          errors={state?.errors?.goal}
        />
        <SelectField
          label="Ração para"
          name="species"
          placeholder="Todas as espécies"
          options={speciesOptions}
          defaultValue={value("species")}
          errors={state?.errors?.species}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Início"
          name="startsAt"
          type="date"
          required
          defaultValue={value("startsAt")}
          errors={state?.errors?.startsAt}
        />
        <Field
          label="Fim (opcional)"
          name="endsAt"
          type="date"
          hint="Último dia da campanha. Em branco, fica no ar até ser desativada."
          defaultValue={value("endsAt")}
          errors={state?.errors?.endsAt}
        />
      </div>
      <CheckboxField
        label="Campanha ativa"
        name="active"
        defaultChecked={active}
        hint="Só campanhas ativas e dentro do período aparecem no site."
      />
      <p className="text-sm text-zinc-500">
        O progresso soma a ração das doações entregues ao abrigo e pagas dentro do período.
      </p>
      <FormMessage message={state?.message} />
      <div>
        <SubmitButton pending={pending}>Salvar campanha</SubmitButton>
      </div>
    </form>
  );
}
