"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, SubmitButton, TextAreaField } from "@/components/form/field";
import type { HelpKind } from "@/lib/validation/help";
import { registerMoneyInterest, registerVolunteerInterest } from "./actions";

// Formulário curto da aba Doar: avisar sobre a doação em dinheiro ou se oferecer como voluntário.
export function HelpInterestForm({ kind }: { kind: HelpKind }) {
  const [state, action, pending] = useActionState(
    kind === "MONEY" ? registerMoneyInterest : registerVolunteerInterest,
    undefined,
  );
  if (state?.success) {
    return (
      <p
        role="status"
        className="rounded-2xl bg-donate-50 p-4 text-sm font-medium text-donate-900 dark:bg-donate-950 dark:text-donate-100"
      >
        {state.message}
      </p>
    );
  }
  const id = (name: string) => `${kind.toLowerCase()}-${name}`;
  const value = (name: string) => String(state?.values?.[name] ?? "");
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id={id("name")}
          label="Seu nome"
          name="name"
          autoComplete="name"
          required
          defaultValue={value("name")}
          errors={state?.errors?.name}
        />
        <Field
          id={id("email")}
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={value("email")}
          errors={state?.errors?.email}
        />
      </div>
      {kind === "VOLUNTEER" && (
        <>
          <Field
            id={id("phone")}
            label="Telefone com DDD (opcional)"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="(11) 98765-4321"
            defaultValue={value("phone")}
            errors={state?.errors?.phone}
          />
          <TextAreaField
            id={id("message")}
            label="Como você gostaria de ajudar? (opcional)"
            name="message"
            rows={3}
            placeholder="Ex.: passeios aos sábados, fotos dos animais, ajudar em eventos..."
            defaultValue={value("message")}
            errors={state?.errors?.message}
          />
        </>
      )}
      <div className="flex flex-col gap-1">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="consent" className="mt-0.5 size-4" />
          <span>
            Aceito que o abrigo use esses dados só para falar comigo sobre isso. Veja a{" "}
            <Link href="/privacidade" className="underline">
              política de privacidade
            </Link>
            .
          </span>
        </label>
        {state?.errors?.consent && (
          <p className="ml-6 text-sm text-red-600">{state.errors.consent.join(" ")}</p>
        )}
      </div>
      <FormMessage message={state?.message} />
      <div>
        <SubmitButton pending={pending}>
          {kind === "MONEY" ? "Quero ser avisado" : "Quero ser voluntário"}
        </SubmitButton>
      </div>
    </form>
  );
}
