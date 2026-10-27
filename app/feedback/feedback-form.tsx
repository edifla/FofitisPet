"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  Field,
  FormMessage,
  RadioGroup,
  SubmitButton,
  TextAreaField,
} from "@/components/form/field";
import { noticeClasses } from "@/components/ui/notice";
import { feedbackKindLabels, toOptions } from "@/lib/labels";
import { sendFeedback } from "./actions";

export function FeedbackForm({ from, loggedIn }: { from: string; loggedIn: boolean }) {
  const [state, action, pending] = useActionState(sendFeedback, undefined);
  const value = (name: string) => String(state?.values?.[name] ?? "");

  if (state?.success) {
    return (
      <div role="status" className={noticeClasses("success", "flex flex-col gap-2")}>
        <p className="font-medium">Obrigado! Seu comentário chegou para a equipe.</p>
        <Link href={from || "/"} className="underline">
          Voltar para onde você estava
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="path" value={from} />
      {/* Armadilha para robôs: escondida de pessoas e leitores de tela. */}
      <div aria-hidden className="hidden">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <RadioGroup
        legend="Sobre o quê?"
        name="kind"
        options={toOptions(feedbackKindLabels)}
        value={value("kind") || "PROBLEM"}
        errors={state?.errors?.kind}
      />
      <TextAreaField
        label="Conte para a gente"
        name="message"
        rows={6}
        required
        hint="O que você tentou fazer, o que aconteceu e o que esperava. Não escreva senhas nem dados de cartão."
        defaultValue={value("message")}
        errors={state?.errors?.message}
      />
      {!loggedIn && (
        <Field
          label="Seu e-mail (opcional)"
          name="email"
          type="email"
          autoComplete="email"
          hint="Só se quiser que a gente responda."
          defaultValue={value("email")}
          errors={state?.errors?.email}
        />
      )}
      {from && <p className="text-sm text-zinc-500">Página: {from}</p>}
      <FormMessage message={state?.message} />
      <SubmitButton pending={pending}>Enviar comentário</SubmitButton>
    </form>
  );
}
