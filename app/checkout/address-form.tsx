"use client";

import { useActionState } from "react";
import {
  CheckboxField,
  Field,
  FormMessage,
  SelectField,
  SubmitButton,
} from "@/components/form/field";
import { UFS } from "@/lib/validation/address";
import { createAddress } from "./actions";

export function AddressForm({ hasAddresses }: { hasAddresses: boolean }) {
  const [state, action, pending] = useActionState(createAddress, undefined);
  const value = (name: string) => String(state?.values?.[name] ?? "");

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Field
        label="Nome de quem vai receber"
        name="recipientName"
        autoComplete="name"
        required
        defaultValue={value("recipientName")}
        errors={state?.errors?.recipientName}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="CEP"
          name="zipCode"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="00000-000"
          required
          defaultValue={value("zipCode")}
          errors={state?.errors?.zipCode}
        />
        <div className="sm:col-span-2">
          <Field
            label="Rua"
            name="street"
            autoComplete="address-line1"
            required
            defaultValue={value("street")}
            errors={state?.errors?.street}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Número"
          name="number"
          required
          defaultValue={value("number")}
          errors={state?.errors?.number}
        />
        <div className="sm:col-span-2">
          <Field
            label="Complemento (opcional)"
            name="complement"
            autoComplete="address-line2"
            defaultValue={value("complement")}
            errors={state?.errors?.complement}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Bairro"
          name="neighborhood"
          required
          defaultValue={value("neighborhood")}
          errors={state?.errors?.neighborhood}
        />
        <Field
          label="Cidade"
          name="city"
          autoComplete="address-level2"
          required
          defaultValue={value("city")}
          errors={state?.errors?.city}
        />
        <SelectField
          label="UF"
          name="state"
          required
          placeholder="Escolha"
          options={UFS.map((uf) => ({ value: uf, label: uf }))}
          defaultValue={value("state")}
          errors={state?.errors?.state}
        />
      </div>
      <Field
        label="Apelido do endereço (opcional)"
        name="label"
        placeholder="Casa, Trabalho..."
        defaultValue={value("label")}
        errors={state?.errors?.label}
      />
      {hasAddresses && <CheckboxField label="Usar como endereço padrão" name="isDefault" />}
      <FormMessage message={state?.message} />
      <div>
        <SubmitButton pending={pending}>Salvar e continuar</SubmitButton>
      </div>
    </form>
  );
}
