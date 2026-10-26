"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/auth/field";
import { requestPasswordReset } from "../actions";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  if (state?.success) {
    return (
      <div className="flex flex-col gap-4">
        <FormMessage tone="success" message={state.message} />
        <Link href="/entrar" className="text-sm font-medium underline">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha.
      </p>
      <Field
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state?.values?.email}
        errors={state?.errors?.email}
      />
      <FormMessage message={state?.message} />
      <SubmitButton pending={pending}>Enviar link</SubmitButton>
      <Link href="/entrar" className="text-center text-sm underline">
        Voltar para o login
      </Link>
    </form>
  );
}
