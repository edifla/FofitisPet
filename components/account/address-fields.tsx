import { Field, SelectField } from "@/components/form/field";
import { UFS } from "@/lib/validation/address";

// Campos de endereço, usados no checkout e na aba "Endereços" da conta.

export type AddressValues = Partial<
  Record<
    | "recipientName"
    | "zipCode"
    | "street"
    | "number"
    | "complement"
    | "neighborhood"
    | "city"
    | "state"
    | "label",
    string
  >
>;

export function AddressFields({
  values,
  errors,
}: {
  values: AddressValues;
  errors?: Record<string, string[] | undefined>;
}) {
  const value = (name: keyof AddressValues) => values[name] ?? "";
  return (
    <>
      <Field
        label="Nome de quem vai receber"
        name="recipientName"
        autoComplete="name"
        required
        defaultValue={value("recipientName")}
        errors={errors?.recipientName}
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
          errors={errors?.zipCode}
        />
        <div className="sm:col-span-2">
          <Field
            label="Rua"
            name="street"
            autoComplete="address-line1"
            required
            defaultValue={value("street")}
            errors={errors?.street}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Número"
          name="number"
          required
          defaultValue={value("number")}
          errors={errors?.number}
        />
        <div className="sm:col-span-2">
          <Field
            label="Complemento (opcional)"
            name="complement"
            autoComplete="address-line2"
            defaultValue={value("complement")}
            errors={errors?.complement}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Bairro"
          name="neighborhood"
          required
          defaultValue={value("neighborhood")}
          errors={errors?.neighborhood}
        />
        <Field
          label="Cidade"
          name="city"
          autoComplete="address-level2"
          required
          defaultValue={value("city")}
          errors={errors?.city}
        />
        <SelectField
          label="UF"
          name="state"
          required
          placeholder="Escolha"
          options={UFS.map((uf) => ({ value: uf, label: uf }))}
          defaultValue={value("state")}
          errors={errors?.state}
        />
      </div>
      <Field
        label="Apelido do endereço (opcional)"
        name="label"
        placeholder="Casa, Trabalho..."
        defaultValue={value("label")}
        errors={errors?.label}
      />
    </>
  );
}
