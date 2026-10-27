"use client";

import { useActionState } from "react";
import { CheckboxField, FormMessage } from "@/components/form/field";
import { confirmDonation } from "../actions";
import { buttonClasses } from "@/components/ui/button";

// Confirma a doação com o total que o cliente está vendo (KAN-31).
export function ConfirmDonationForm({ totalCents }: { totalCents: number }) {
  const [state, action, pending] = useActionState(confirmDonation, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="expectedTotalCents" value={totalCents} />
      <CheckboxField
        label="Doar de forma anônima"
        name="anonymous"
        hint="Seu nome não aparece na página de transparência das doações."
      />
      <div className="flex flex-col items-end gap-2">
        <FormMessage message={state?.message} />
        <button
          type="submit"
          disabled={pending}
          className={buttonClasses({ variant: "donate", size: "lg" })}
        >
          {pending ? "Criando doação..." : "Confirmar doação"}
        </button>
        <p className="text-sm text-zinc-500">
          Na próxima etapa você paga com Pix ou cartão. Os itens ficam reservados para o abrigo.
        </p>
      </div>
    </form>
  );
}
