"use client";

import { useActionState } from "react";
import { FormMessage, SelectField, TextAreaField } from "@/components/form/field";
import { buttonClasses } from "@/components/ui/button";
import { feedbackPriorityLabels, feedbackStatusLabels, toOptions } from "@/lib/labels";
import { updateFeedback } from "./actions";

export function TriageForm({
  feedbackId,
  status,
  priority,
  adminNote,
}: {
  feedbackId: string;
  status: string;
  priority: string;
  adminNote: string;
}) {
  const [state, action, pending] = useActionState(updateFeedback.bind(null, feedbackId), undefined);
  return (
    <form
      action={action}
      className="grid gap-3 sm:grid-cols-[10rem_10rem_1fr_auto] sm:items-end"
      noValidate
    >
      <SelectField
        label="Situação"
        name="status"
        id={`status-${feedbackId}`}
        options={toOptions(feedbackStatusLabels)}
        defaultValue={String(state?.values?.status ?? status)}
        errors={state?.errors?.status}
      />
      <SelectField
        label="Prioridade"
        name="priority"
        id={`priority-${feedbackId}`}
        placeholder="Sem prioridade"
        options={toOptions(feedbackPriorityLabels)}
        defaultValue={String(state?.values?.priority ?? priority)}
        errors={state?.errors?.priority}
      />
      <TextAreaField
        label="Anotação da equipe"
        name="adminNote"
        id={`note-${feedbackId}`}
        rows={1}
        defaultValue={String(state?.values?.adminNote ?? adminNote)}
        errors={state?.errors?.adminNote}
      />
      <div className="flex flex-col gap-1">
        <button type="submit" disabled={pending} className={buttonClasses({ size: "sm" })}>
          {pending ? "Salvando..." : "Salvar"}
        </button>
        <FormMessage message={state?.message} tone={state?.success ? "success" : "error"} />
      </div>
    </form>
  );
}
