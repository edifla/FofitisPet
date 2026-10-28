"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AddressFields, type AddressValues } from "@/components/account/address-fields";
import { CheckboxField, FormMessage, SubmitButton } from "@/components/form/field";
import { saveAddress } from "../profile-actions";

// Cadastro (addressId nulo) ou edição de um endereço da conta.
export function AccountAddressForm({
  addressId,
  initial,
  isDefault,
}: {
  addressId: string | null;
  initial: AddressValues;
  isDefault: boolean;
}) {
  const [state, action, pending] = useActionState(saveAddress.bind(null, addressId), undefined);
  const values: AddressValues = state?.values
    ? Object.fromEntries(Object.entries(state.values).map(([key, v]) => [key, String(v)]))
    : initial;
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <AddressFields values={values} errors={state?.errors} />
      {!isDefault && <CheckboxField label="Usar como endereço padrão" name="isDefault" />}
      <FormMessage message={state?.message} />
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton pending={pending}>
          {addressId ? "Salvar alterações" : "Salvar endereço"}
        </SubmitButton>
        <Link href="/conta/enderecos" className="text-sm underline">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
