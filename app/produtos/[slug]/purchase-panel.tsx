"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { FormMessage } from "@/components/form/field";
import { formatBRL } from "@/lib/money";
import { addToCart } from "../../carrinho/actions";

export type PurchaseVariant = {
  id: string;
  name: string;
  priceCents: number;
  stock: number;
};

function availability(stock: number, fewLeft: number) {
  if (stock <= 0) return { text: "Esgotado", className: "text-zinc-500" };
  if (stock <= fewLeft) {
    return { text: `Últimas ${stock} unidade(s)`, className: "text-amber-700 dark:text-amber-400" };
  }
  return { text: "Em estoque", className: "text-green-700 dark:text-green-400" };
}

// Escolha da variação, preço, disponibilidade e quantidade.
export function PurchasePanel({
  variants,
  fewLeft,
}: {
  variants: PurchaseVariant[];
  fewLeft: number;
}) {
  // Começa pela primeira variação com estoque, se houver.
  const [selectedId, setSelectedId] = useState(
    (variants.find((v) => v.stock > 0) ?? variants[0]).id,
  );
  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];
  const status = availability(selected.stock, fewLeft);
  const soldOut = selected.stock <= 0;
  const [state, action, pending] = useActionState(addToCart, undefined);

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="variantId" value={selected.id} />

      {variants.length > 1 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Opção</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <label
                key={variant.id}
                className="cursor-pointer rounded-md border border-zinc-300 px-3 py-2 text-sm has-checked:border-zinc-900 has-checked:font-medium dark:border-zinc-700 dark:has-checked:border-zinc-100"
              >
                <input
                  type="radio"
                  name="variant"
                  value={variant.id}
                  checked={variant.id === selected.id}
                  onChange={() => setSelectedId(variant.id)}
                  className="sr-only"
                />
                {variant.name}
                {variant.stock <= 0 && <span className="ml-1 text-zinc-500">(esgotado)</span>}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div>
        <p className="text-3xl font-semibold">{formatBRL(selected.priceCents)}</p>
        <p className={`text-sm ${status.className}`} aria-live="polite">
          {variants.length === 1 && `${selected.name} · `}
          {status.text}
        </p>
      </div>

      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="quantity" className="text-sm font-medium">
            Quantidade
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            max={Math.max(1, selected.stock)}
            defaultValue={1}
            disabled={soldOut}
            className="w-20 rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          disabled={soldOut || pending}
          className="flex-1 rounded-md bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {soldOut ? "Esgotado" : pending ? "Adicionando..." : "Adicionar ao carrinho"}
        </button>
      </div>
      {state?.message && (
        <div className="flex items-center gap-3">
          <FormMessage message={state.message} tone={state.success ? "success" : "error"} />
          {state.success && (
            <Link href="/carrinho" className="text-sm font-medium underline">
              Ver carrinho
            </Link>
          )}
        </div>
      )}
    </form>
  );
}
