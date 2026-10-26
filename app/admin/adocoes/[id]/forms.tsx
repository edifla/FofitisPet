"use client";

import { useActionState, useState } from "react";
import {
  Field,
  FormMessage,
  SelectField,
  SubmitButton,
  TextAreaField,
} from "@/components/form/field";
import { saveAdminNotes, updateRequestStatus } from "../actions";

const hints: Record<string, string> = {
  APPROVED:
    "O animal passa a adotado e as outras solicitações abertas para ele são recusadas, com aviso por e-mail.",
  REJECTED: "O interessado recebe um e-mail avisando que a adoção não vai seguir.",
  INTERVIEW: "O interessado recebe um e-mail com a data sugerida.",
};

// Mudança de status com anotação no histórico (KAN-116).
export function StatusForm({
  requestId,
  options,
}: {
  requestId: string;
  options: { value: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(
    updateRequestStatus.bind(null, requestId),
    undefined,
  );
  const [status, setStatus] = useState(String(state?.values?.status ?? ""));

  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <SelectField
        label="Novo status"
        name="status"
        placeholder="Escolha"
        options={options}
        value={status}
        onChange={(event) => setStatus(event.target.value)}
        hint={hints[status]}
        errors={state?.errors?.status}
      />
      {status === "INTERVIEW" && (
        <Field
          label="Data e hora da entrevista"
          name="interviewAt"
          type="datetime-local"
          defaultValue={String(state?.values?.interviewAt ?? "")}
          errors={state?.errors?.interviewAt}
        />
      )}
      <TextAreaField
        label="Anotação (opcional)"
        name="note"
        rows={3}
        hint="Fica no histórico. Não é enviada ao interessado."
        defaultValue={String(state?.values?.note ?? "")}
        errors={state?.errors?.note}
      />
      <FormMessage message={state?.message} tone={state?.success ? "success" : "error"} />
      <SubmitButton pending={pending}>Salvar status</SubmitButton>
    </form>
  );
}

export function NotesForm({ requestId, notes }: { requestId: string; notes: string }) {
  const [state, action, pending] = useActionState(saveAdminNotes.bind(null, requestId), undefined);
  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <TextAreaField
        label="Anotações"
        name="adminNotes"
        rows={6}
        hint="Só a equipe vê."
        defaultValue={String(state?.values?.adminNotes ?? notes)}
        errors={state?.errors?.adminNotes}
      />
      <FormMessage message={state?.message} tone={state?.success ? "success" : "error"} />
      <SubmitButton pending={pending}>Salvar anotações</SubmitButton>
    </form>
  );
}
