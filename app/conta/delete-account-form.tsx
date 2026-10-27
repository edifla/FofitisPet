"use client";

import { useActionState } from "react";
import { Field, FormMessage } from "@/components/form/field";
import { deleteAccountAction } from "./actions";
import { buttonClasses } from "@/components/ui/button";

// Exclusão da conta (KAN-126): senha e confirmação explícita.
export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccountAction, undefined);
  return (
    <form action={action} className="flex max-w-md flex-col gap-3" noValidate>
      <Field
        label="Sua senha"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        errors={state?.errors?.password}
      />
      <div className="flex flex-col gap-1">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="confirm" className="mt-0.5 size-4" />
          Entendo que a exclusão não pode ser desfeita.
        </label>
        {state?.errors?.confirm && (
          <p className="ml-6 text-sm text-red-600">{state.errors.confirm.join(" ")}</p>
        )}
      </div>
      <FormMessage message={state?.message} />
      <button
        type="submit"
        disabled={pending}
        className={buttonClasses({ variant: "danger", size: "sm", className: "self-start" })}
      >
        {pending ? "Excluindo..." : "Excluir minha conta"}
      </button>
    </form>
  );
}
