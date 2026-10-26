"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form/field";
import { login } from "../actions";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="callbackUrl" value={searchParams.get("callbackUrl") ?? ""} />
      {searchParams.get("senha") === "redefinida" && (
        <FormMessage tone="success" message="Senha redefinida. Entre com a nova senha." />
      )}
      {searchParams.get("conta") === "excluida" && (
        <FormMessage
          tone="success"
          message="Sua conta foi excluída. Enviamos a confirmação por e-mail."
        />
      )}
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
        autoComplete="current-password"
        required
        errors={state?.errors?.password}
      />
      <Link href="/esqueci-senha" className="-mt-2 self-end text-sm underline">
        Esqueci minha senha
      </Link>
      <FormMessage message={state?.message} />
      <SubmitButton pending={pending}>Entrar</SubmitButton>
      <p className="text-center text-sm">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium underline">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
