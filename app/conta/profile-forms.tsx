"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form/field";
import { changeEmail, changePassword, updateProfile } from "./profile-actions";

// Formulários da área "Minha conta". Os valores salvos chegam por props; depois de um erro, o
// formulário mostra o que a pessoa tinha digitado.

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  const value = (field: "name" | "phone", saved: string) =>
    state?.values?.[field] !== undefined ? String(state.values[field]) : saved;
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Nome completo"
          name="name"
          autoComplete="name"
          required
          defaultValue={value("name", name)}
          errors={state?.errors?.name}
        />
        <Field
          label="Telefone (opcional)"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(11) 98765-4321"
          hint="Para a transportadora e o abrigo falarem com você, se precisar."
          defaultValue={value("phone", phone)}
          errors={state?.errors?.phone}
        />
      </div>
      <FormMessage message={state?.message} tone={state?.success ? "success" : "error"} />
      <div>
        <SubmitButton pending={pending}>Salvar dados</SubmitButton>
      </div>
    </form>
  );
}

export function EmailForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(changeEmail, undefined);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Novo e-mail"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state?.values?.email !== undefined ? String(state.values.email) : email}
          errors={state?.errors?.email}
        />
        <Field
          label="Senha atual"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          hint="Para confirmar que é você."
          errors={state?.errors?.currentPassword}
        />
      </div>
      <FormMessage message={state?.message} tone={state?.success ? "success" : "error"} />
      <div>
        <SubmitButton pending={pending}>Trocar e-mail</SubmitButton>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  return (
    <form action={action} className="flex max-w-md flex-col gap-4" noValidate>
      <Field
        label="Senha atual"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        required
        errors={state?.errors?.currentPassword}
      />
      <Field
        label="Nova senha"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint="Pelo menos 8 caracteres, com letras e números."
        errors={state?.errors?.password}
      />
      <Field
        label="Repita a nova senha"
        name="passwordConfirmation"
        type="password"
        autoComplete="new-password"
        required
        errors={state?.errors?.passwordConfirmation}
      />
      <FormMessage message={state?.message} />
      <div>
        <SubmitButton pending={pending}>Trocar senha</SubmitButton>
      </div>
    </form>
  );
}
