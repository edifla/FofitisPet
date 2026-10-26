"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form/field";
import { signup } from "../actions";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Field
        label="Nome"
        name="name"
        autoComplete="name"
        required
        defaultValue={state?.values?.name}
        errors={state?.errors?.name}
      />
      <Field
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state?.values?.email}
        errors={state?.errors?.email}
      />
      <Field
        label="Senha"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        errors={state?.errors?.password}
      />
      <Field
        label="Confirme a senha"
        name="passwordConfirmation"
        type="password"
        autoComplete="new-password"
        required
        errors={state?.errors?.passwordConfirmation}
      />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        A senha precisa ter pelo menos 8 caracteres, com letras e números.
      </p>
      <div className="flex flex-col gap-1">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="acceptTerms"
            required
            className="mt-0.5 size-4"
            aria-invalid={state?.errors?.acceptTerms ? true : undefined}
          />
          <span>
            Li e aceito os{" "}
            <Link href="/termos" className="underline" target="_blank">
              termos de uso
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" className="underline" target="_blank">
              política de privacidade
            </Link>
            .
          </span>
        </label>
        {state?.errors?.acceptTerms && (
          <p className="ml-6 text-sm text-red-600">{state.errors.acceptTerms.join(" ")}</p>
        )}
      </div>
      <FormMessage message={state?.message} />
      <SubmitButton pending={pending}>Criar conta</SubmitButton>
      <p className="text-center text-sm">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-medium underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
