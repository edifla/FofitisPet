"use client";

import { useActionState } from "react";
import { updateCartQuantity } from "./actions";

// Controles de quantidade de um item. Os botões − e + enviam um passo (-1/+1) sobre a quantidade
// atual; o campo permite digitar e confirmar com "Atualizar" (funciona sem JavaScript).
export function QuantityForm({
  itemId,
  quantity,
  max,
  productName,
}: {
  itemId: string;
  quantity: number;
  max: number;
  productName: string;
}) {
  const [state, action, pending] = useActionState(updateCartQuantity.bind(null, itemId), undefined);
  const button =
    "size-8 rounded-md border border-zinc-300 text-sm disabled:opacity-40 dark:border-zinc-700";

  return (
    <form key={quantity} action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="current" value={quantity} />
      {/* Enter no campo usa o primeiro botão de envio; este garante que vale o valor digitado. */}
      <button type="submit" tabIndex={-1} aria-hidden="true" className="sr-only">
        Atualizar
      </button>
      <div className="flex items-center gap-1">
        <button
          type="submit"
          name="step"
          value="-1"
          disabled={pending}
          aria-label={`Diminuir quantidade de ${productName}`}
          className={button}
        >
          −
        </button>
        <label htmlFor={`qtd-${itemId}`} className="sr-only">
          Quantidade de {productName}
        </label>
        <input
          id={`qtd-${itemId}`}
          name="quantity"
          type="number"
          min={0}
          max={max}
          defaultValue={quantity}
          className="w-14 rounded-md border border-zinc-300 px-2 py-1 text-center text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          name="step"
          value="1"
          disabled={pending || quantity >= max}
          aria-label={`Aumentar quantidade de ${productName}`}
          className={button}
        >
          +
        </button>
      </div>
      <button type="submit" disabled={pending} className="text-xs underline">
        {pending ? "Atualizando..." : "Atualizar"}
      </button>
      {state?.message && (
        <p
          role={state.success ? "status" : "alert"}
          className={
            state.success ? "text-xs text-amber-700 dark:text-amber-400" : "text-xs text-red-600"
          }
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
