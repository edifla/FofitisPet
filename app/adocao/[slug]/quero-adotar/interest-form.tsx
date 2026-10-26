"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  Field,
  FormMessage,
  SelectField,
  SubmitButton,
  TextAreaField,
} from "@/components/form/field";
import { housingTypeLabels, toOptions } from "@/lib/labels";
import { UFS } from "@/lib/validation/address";
import { submitAdoptionInterest } from "../../actions";

const ufOptions = UFS.map((uf) => ({ value: uf, label: uf }));

// Formulário de interesse em adoção (KAN-39).
export function InterestForm({
  animalId,
  animalName,
  defaults,
}: {
  animalId: string;
  animalName: string;
  defaults: { applicantName: string; applicantEmail: string };
}) {
  const [state, action, pending] = useActionState(
    submitAdoptionInterest.bind(null, animalId),
    undefined,
  );
  const value = (name: string) =>
    String(state?.values?.[name] ?? defaults[name as keyof typeof defaults] ?? "");

  if (state?.success) {
    return (
      <div
        role="status"
        className="flex flex-col gap-3 rounded-md bg-emerald-50 p-6 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
      >
        <h2 className="text-lg font-semibold">Recebemos seu interesse!</h2>
        <p>
          A equipe do abrigo vai ler seu formulário e entrar em contato sobre {animalName}. Você
          também vai receber um e-mail de confirmação.
        </p>
        <Link href="/adocao" className="underline">
          Ver outros animais
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      {/* Armadilha para robôs: escondida de pessoas e leitores de tela. */}
      <div aria-hidden className="hidden">
        <label>
          Site
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-lg font-semibold">Seus dados</legend>
        <Field
          label="Nome completo"
          name="applicantName"
          autoComplete="name"
          required
          defaultValue={value("applicantName")}
          errors={state?.errors?.applicantName}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="E-mail"
            name="applicantEmail"
            type="email"
            autoComplete="email"
            required
            defaultValue={value("applicantEmail")}
            errors={state?.errors?.applicantEmail}
          />
          <Field
            label="Telefone ou WhatsApp"
            name="applicantPhone"
            type="tel"
            autoComplete="tel"
            placeholder="(11) 91234-5678"
            required
            defaultValue={value("applicantPhone")}
            errors={state?.errors?.applicantPhone}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <Field
            label="Cidade"
            name="applicantCity"
            autoComplete="address-level2"
            required
            defaultValue={value("applicantCity")}
            errors={state?.errors?.applicantCity}
          />
          <SelectField
            label="UF"
            name="applicantState"
            placeholder="UF"
            options={ufOptions}
            required
            defaultValue={value("applicantState")}
            errors={state?.errors?.applicantState}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-lg font-semibold">Sua casa</legend>
        <SelectField
          label="Tipo de moradia"
          name="housingType"
          placeholder="Escolha"
          options={toOptions(housingTypeLabels)}
          required
          defaultValue={value("housingType")}
          errors={state?.errors?.housingType}
        />
        <YesNo
          legend="A moradia é própria?"
          name="ownsHome"
          value={value("ownsHome")}
          errors={state?.errors?.ownsHome}
        />
        <YesNo
          legend="Tem quintal ou área externa?"
          name="hasYard"
          value={value("hasYard")}
          errors={state?.errors?.hasYard}
        />
        <YesNo
          legend="Todos que moram com você concordam com a adoção?"
          name="householdAgrees"
          value={value("householdAgrees")}
          errors={state?.errors?.householdAgrees}
        />
        <YesNo
          legend="Já tem outros animais em casa?"
          name="hasOtherPets"
          value={value("hasOtherPets")}
          errors={state?.errors?.hasOtherPets}
        />
        <TextAreaField
          label="Se sim, quais?"
          name="otherPetsDescription"
          rows={2}
          hint="Espécie, idade e se são castrados e vacinados."
          defaultValue={value("otherPetsDescription")}
          errors={state?.errors?.otherPetsDescription}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-lg font-semibold">Sobre a adoção</legend>
        <TextAreaField
          label="Qual a sua experiência com animais?"
          name="experience"
          required
          defaultValue={value("experience")}
          errors={state?.errors?.experience}
        />
        <TextAreaField
          label={`Por que você quer adotar ${animalName}?`}
          name="reason"
          required
          hint="Conte também como seria a rotina do animal na sua casa."
          defaultValue={value("reason")}
          errors={state?.errors?.reason}
        />
      </fieldset>

      <div className="flex flex-col gap-1">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="consent"
            className="mt-0.5 size-4"
            defaultChecked={state?.values?.consent === "on"}
            aria-invalid={state?.errors?.consent ? true : undefined}
          />
          <span>
            Autorizo o abrigo da FofitisPet a usar estes dados só para avaliar a adoção e entrar em
            contato comigo, conforme a{" "}
            <Link href="/privacidade" className="underline" target="_blank">
              política de privacidade
            </Link>
            . Li o{" "}
            <Link href="/termo-de-adocao" className="underline" target="_blank">
              termo de adoção responsável
            </Link>
            .
          </span>
        </label>
        {state?.errors?.consent && (
          <p className="ml-6 text-sm text-red-600">{state.errors.consent.join(" ")}</p>
        )}
      </div>

      <FormMessage message={state?.message} />
      <SubmitButton pending={pending}>Enviar interesse</SubmitButton>
    </form>
  );
}

function YesNo({
  legend,
  name,
  value,
  errors,
}: {
  legend: string;
  name: string;
  value: string;
  errors?: string[];
}) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="flex gap-6">
        {[
          ["sim", "Sim"],
          ["nao", "Não"],
        ].map(([option, label]) => (
          <label key={option} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={name}
              value={option}
              defaultChecked={value === option}
              className="size-4"
            />
            {label}
          </label>
        ))}
      </div>
      {errors?.length ? <p className="text-sm text-red-600">{errors.join(" ")}</p> : null}
    </fieldset>
  );
}
