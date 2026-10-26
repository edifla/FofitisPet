"use client";

import { useActionState, useState } from "react";
import { FormMessage } from "@/components/form/field";
import { payWithPix, simulatePixPaid } from "../actions";

const buttonClass =
  "rounded-md bg-zinc-900 px-5 py-2.5 font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900";

// Botão que gera o Pix do pedido (KAN-108).
export function StartPixForm({ orderNumber }: { orderNumber: number }) {
  const [state, action, pending] = useActionState(payWithPix.bind(null, orderNumber), undefined);
  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <FormMessage message={state?.message} />
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Gerando Pix..." : "Pagar com Pix"}
      </button>
    </form>
  );
}

// Código "copia e cola" com botão de copiar.
export function PixCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="pix-code" className="text-sm font-medium">
        Pix copia e cola
      </label>
      <textarea
        id="pix-code"
        readOnly
        value={code}
        rows={3}
        className="w-full resize-none rounded-md border border-zinc-300 bg-white p-2 font-mono text-xs break-all dark:border-zinc-700 dark:bg-zinc-950"
        onFocus={(event) => event.currentTarget.select()}
      />
      <button
        type="button"
        className="self-start rounded-md border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
          } catch {
            setCopied(false);
          }
        }}
      >
        {copied ? "Copiado!" : "Copiar código"}
      </button>
    </div>
  );
}

// Só aparece com o gateway simulado: faz o papel do banco confirmando o pagamento.
export function SimulatePixForm({ orderNumber }: { orderNumber: number }) {
  const [state, action, pending] = useActionState(
    simulatePixPaid.bind(null, orderNumber),
    undefined,
  );
  return (
    <form
      action={action}
      className="flex flex-col items-start gap-2 rounded-md border border-dashed border-amber-400 p-3"
    >
      <p className="text-xs text-amber-800 dark:text-amber-300">
        Ambiente de teste: nenhum pagamento real é feito. Use o botão abaixo para simular o aviso do
        banco.
      </p>
      <FormMessage message={state?.message} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Simulando..." : "Simular pagamento do Pix"}
      </button>
    </form>
  );
}
