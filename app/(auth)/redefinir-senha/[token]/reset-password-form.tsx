"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form/field";
import { resetPassword } from "../../actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, undefined);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <Field
        label="Nova senha"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        errors={state?.errors?.password}
      />
      <Field
        label="Confirme a nova senha"
        name="passwordConfirmation"
        type="password"
        autoComplete="new-password"
        required
        errors={state?.errors?.passwordConfirmation}
      />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        A senha precisa ter pelo menos 8 caracteres, com letras e números. Ao trocar a senha, você
        sai da conta em todos os dispositivos.
      </p>
      <FormMessage message={state?.message} />
      <SubmitButton pending={pending}>Salvar nova senha</SubmitButton>
    </form>
  );
}
