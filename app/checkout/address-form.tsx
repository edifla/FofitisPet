"use client";

import { useActionState } from "react";
import { AddressFields } from "@/components/account/address-fields";
import { CheckboxField, FormMessage, SubmitButton } from "@/components/form/field";
import { createAddress } from "./actions";

export function AddressForm({ hasAddresses }: { hasAddresses: boolean }) {
  const [state, action, pending] = useActionState(createAddress, undefined);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <AddressFields
        values={Object.fromEntries(
          Object.entries(state?.values ?? {}).map(([key, v]) => [key, String(v)]),
        )}
        errors={state?.errors}
      />
      {hasAddresses && <CheckboxField label="Usar como endereço padrão" name="isDefault" />}
      <FormMessage message={state?.message} />
      <div>
        <SubmitButton pending={pending}>Salvar e continuar</SubmitButton>
      </div>
    </form>
  );
}
