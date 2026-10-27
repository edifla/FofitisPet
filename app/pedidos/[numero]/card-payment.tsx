"use client";

import { useActionState } from "react";
import { Field, FormMessage, SelectField } from "@/components/form/field";
import { payWithCardAction } from "../actions";
import { buttonClasses } from "@/components/ui/button";

type TestCards = {
  cards: readonly { brand: string; number: string; cvv: string }[];
  holderNames: readonly { name: string; result: string }[];
};

// Formulário do cartão (KAN-109). No gateway simulado, lista os cartões de teste aceitos.
export function CardPaymentForm({
  orderNumber,
  installmentOptions,
  testCards,
}: {
  orderNumber: number;
  installmentOptions: { value: string; label: string }[];
  testCards?: TestCards;
}) {
  const [state, action, pending] = useActionState(
    payWithCardAction.bind(null, orderNumber),
    undefined,
  );
  const value = (name: string) => String(state?.values?.[name] ?? "");

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Field
        label="Número do cartão"
        name="cardNumber"
        inputMode="numeric"
        autoComplete="cc-number"
        placeholder="0000 0000 0000 0000"
        required
        errors={state?.errors?.cardNumber}
      />
      <Field
        label="Nome impresso no cartão"
        name="holderName"
        autoComplete="cc-name"
        required
        defaultValue={value("holderName")}
        errors={state?.errors?.holderName}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Validade"
          name="expiry"
          inputMode="numeric"
          autoComplete="cc-exp"
          placeholder="MM/AA"
          required
          defaultValue={value("expiry")}
          errors={state?.errors?.expiry}
        />
        <Field
          label="Código de segurança"
          name="cvv"
          inputMode="numeric"
          autoComplete="cc-csc"
          placeholder="CVV"
          required
          errors={state?.errors?.cvv}
        />
        <SelectField
          label="Parcelas"
          name="installments"
          options={installmentOptions}
          defaultValue={value("installments") || "1"}
          errors={state?.errors?.installments}
        />
      </div>
      <FormMessage message={state?.message} />
      <button
        type="submit"
        disabled={pending}
        className={buttonClasses({ size: "lg", className: "self-start" })}
      >
        {pending ? "Processando..." : "Pagar com cartão"}
      </button>

      {testCards && (
        <div className="rounded-md border border-dashed border-amber-400 p-3 text-xs text-amber-900 dark:text-amber-200">
          <p className="font-medium">Ambiente de teste: nenhum cartão real é aceito.</p>
          <ul className="mt-1">
            {testCards.cards.map((card) => (
              <li key={card.number} className="font-mono">
                {card.brand}: {card.number} · CVV {card.cvv} · validade futura
              </li>
            ))}
          </ul>
          <p className="mt-1">
            O nome no cartão define o resultado:{" "}
            {testCards.holderNames.map((holder) => `${holder.name} (${holder.result})`).join(", ")}.
          </p>
        </div>
      )}
    </form>
  );
}
