"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  CheckboxField,
  CheckboxGroup,
  Field,
  FormMessage,
  SelectField,
  SubmitButton,
  TextAreaField,
} from "@/components/form/field";
import {
  animalSexLabels,
  animalSizeLabels,
  animalStatusLabels,
  speciesOptions,
  temperamentLabels,
  toOptions,
} from "@/lib/labels";
import { saveAnimal } from "./actions";

export type AnimalFormData = {
  id: string;
  name: string;
  slug: string;
  species: string;
  size: string;
  sex: string;
  birthDate: string;
  temperament: string[];
  story: string;
  healthNotes: string;
  specialNeeds: string;
  neutered: boolean;
  dewormed: boolean;
  status: string;
  arrivedAt: string;
};

type TextField = Exclude<keyof AnimalFormData, "id" | "temperament" | "neutered" | "dewormed">;

// Formulário do animal (KAN-111), com a parte de saúde (KAN-113).
export function AnimalForm({ animal, today }: { animal?: AnimalFormData; today: string }) {
  const [state, action, pending] = useActionState(
    saveAnimal.bind(null, animal?.id ?? null),
    undefined,
  );
  const value = (name: TextField) => {
    const typed = state?.values?.[name];
    if (typed !== undefined) return String(typed);
    return animal?.[name] ?? "";
  };
  const temperament =
    (state?.values?.temperament as string[] | undefined) ?? animal?.temperament ?? [];

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nome"
          name="name"
          required
          defaultValue={value("name")}
          errors={state?.errors?.name}
        />
        <Field
          label="Slug"
          name="slug"
          defaultValue={value("slug")}
          hint="Endereço da página do animal. Em branco, é gerado a partir do nome."
          errors={state?.errors?.slug}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField
          label="Espécie"
          name="species"
          placeholder="Escolha"
          options={speciesOptions}
          defaultValue={value("species")}
          errors={state?.errors?.species}
        />
        <SelectField
          label="Porte"
          name="size"
          placeholder="Escolha"
          options={toOptions(animalSizeLabels)}
          defaultValue={value("size")}
          errors={state?.errors?.size}
        />
        <SelectField
          label="Sexo"
          name="sex"
          placeholder="Escolha"
          options={toOptions(animalSexLabels)}
          defaultValue={value("sex")}
          errors={state?.errors?.sex}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nascimento (pode ser estimado)"
          name="birthDate"
          type="date"
          max={today}
          defaultValue={value("birthDate")}
          hint="A idade mostrada no site é calculada a partir desta data."
          errors={state?.errors?.birthDate}
        />
        <Field
          label="Chegada ao abrigo"
          name="arrivedAt"
          type="date"
          max={today}
          defaultValue={value("arrivedAt")}
          errors={state?.errors?.arrivedAt}
        />
      </div>
      <CheckboxGroup
        legend="Temperamento"
        name="temperament"
        options={toOptions(temperamentLabels)}
        defaultValues={temperament}
        errors={state?.errors?.temperament}
      />
      <TextAreaField
        label="História"
        name="story"
        required
        defaultValue={value("story")}
        hint="Como chegou ao abrigo, jeito, rotina. Aparece na página do animal."
        errors={state?.errors?.story}
      />

      <fieldset className="flex flex-col gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <legend className="font-medium">Saúde</legend>
        <div className="flex flex-wrap gap-6">
          <CheckboxField
            label="Castrado(a)"
            name="neutered"
            defaultChecked={animal?.neutered ?? false}
          />
          <CheckboxField
            label="Vermifugado(a)"
            name="dewormed"
            defaultChecked={animal?.dewormed ?? false}
          />
        </div>
        <TextAreaField
          label="Observações de saúde (opcional)"
          name="healthNotes"
          rows={3}
          defaultValue={value("healthNotes")}
          errors={state?.errors?.healthNotes}
        />
        <TextAreaField
          label="Necessidades especiais (opcional)"
          name="specialNeeds"
          rows={2}
          defaultValue={value("specialNeeds")}
          hint="Ex.: medicação contínua, dieta especial, deficiência visual."
          errors={state?.errors?.specialNeeds}
        />
        <p className="text-sm text-zinc-500">
          As vacinas são registradas depois de salvar, na página do animal.
        </p>
      </fieldset>

      <SelectField
        label="Situação"
        name="status"
        options={toOptions(animalStatusLabels)}
        defaultValue={value("status") || "AVAILABLE"}
        hint='Só "Disponível para adoção" e "Reservado" aparecem para o público.'
        errors={state?.errors?.status}
      />
      <FormMessage message={state?.message} />
      <div className="flex items-center gap-4">
        <SubmitButton pending={pending}>
          {animal ? "Salvar alterações" : "Cadastrar animal"}
        </SubmitButton>
        <Link href="/admin/animais" className="text-sm underline">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
