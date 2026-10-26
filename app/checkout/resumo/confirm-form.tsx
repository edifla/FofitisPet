"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/form/field";
import { confirmOrder } from "../actions";

// Confirma o pedido com o total que o cliente está vendo (KAN-107).
export function ConfirmOrderForm({
  addressId,
  shippingId,
  totalCents,
}: {
  addressId: string;
  shippingId: string;
  totalCents: number;
}) {
  const [state, action, pending] = useActionState(confirmOrder, undefined);

  return (
    <form action={action} className="flex flex-col items-end gap-2">
      <input type="hidden" name="addressId" value={addressId} />
      <input type="hidden" name="shippingId" value={shippingId} />
      <input type="hidden" name="expectedTotalCents" value={totalCents} />
      <FormMessage message={state?.message} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-6 py-3 font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Criando pedido..." : "Confirmar pedido"}
      </button>
      <p className="text-sm text-zinc-500">
        Na próxima etapa você escolhe como pagar. O estoque fica reservado para o seu pedido.
      </p>
    </form>
  );
}
