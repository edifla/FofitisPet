"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/form/field";
import { adjustStoreStock, restockVariant, setShelterTarget } from "../../actions";

export function RestockForm({ variantId }: { variantId: string }) {
  const [state, action, pending] = useActionState(restockVariant.bind(null, variantId), undefined);
  const values = state?.success ? undefined : state?.values;

  return (
    <form key={state?.message} action={action} className="flex flex-col gap-3" noValidate>
      <h2 className="font-medium">Entrada de mercadoria</h2>
      <Field
        label="Unidades recebidas"
        name="quantity"
        type="number"
        min={1}
        required
        defaultValue={values?.quantity}
        errors={state?.errors?.quantity}
      />
      <Field
        label="Observação (opcional)"
        name="note"
        placeholder="Ex.: nota fiscal 1234"
        defaultValue={values?.note}
        errors={state?.errors?.note}
      />
      <FormMessage message={state?.message} tone={state?.success ? "success" : "error"} />
      <div>
        <SubmitButton pending={pending}>Registrar entrada</SubmitButton>
      </div>
    </form>
  );
}

export function AdjustmentForm({ variantId, current }: { variantId: string; current: number }) {
  const [state, action, pending] = useActionState(
    adjustStoreStock.bind(null, variantId),
    undefined,
  );
  const values = state?.success ? undefined : state?.values;

  return (
    <form key={state?.message} action={action} className="flex flex-col gap-3" noValidate>
      <h2 className="font-medium">Ajuste de inventário</h2>
      <Field
        label="Quantidade contada na loja"
        name="counted"
        type="number"
        min={0}
        required
        defaultValue={values?.counted ?? String(current)}
        hint="O sistema registra a diferença em relação ao saldo atual."
        errors={state?.errors?.counted}
      />
      <Field
        label="Motivo"
        name="note"
        required
        placeholder="Ex.: inventário mensal, embalagem avariada"
        defaultValue={values?.note}
        errors={state?.errors?.note}
      />
      <FormMessage message={state?.message} tone={state?.success ? "success" : "error"} />
      <div>
        <SubmitButton pending={pending}>Ajustar saldo</SubmitButton>
      </div>
    </form>
  );
}

// Meta de saldo no abrigo (KAN-33).
export function ShelterTargetForm({
  variantId,
  current,
  donationEligible,
}: {
  variantId: string;
  current: number | null;
  donationEligible: boolean;
}) {
  const [state, action, pending] = useActionState(
    setShelterTarget.bind(null, variantId),
    undefined,
  );
  const values = state?.success ? undefined : state?.values;

  return (
    <form key={state?.message} action={action} className="flex flex-col gap-3" noValidate>
      <h2 className="font-medium">Meta no abrigo</h2>
      <Field
        label="Saldo desejado no abrigo"
        name="target"
        type="number"
        min={0}
        defaultValue={values?.target ?? (current === null ? "" : String(current))}
        hint={
          donationEligible
            ? 'Abaixo da meta, o item aparece em "Itens mais necessários". Deixe vazio para não ter meta.'
            : "O produto não está marcado como doável, então não aparece para doação."
        }
        errors={state?.errors?.target}
      />
      <FormMessage message={state?.message} tone={state?.success ? "success" : "error"} />
      <div>
        <SubmitButton pending={pending}>Salvar meta</SubmitButton>
      </div>
    </form>
  );
}
