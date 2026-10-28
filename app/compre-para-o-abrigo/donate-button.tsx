"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormMessage } from "@/components/form/field";
import { addToCart } from "../carrinho/actions";
import { buttonClasses } from "@/components/ui/button";

// Põe 1 unidade na doação ao abrigo (KAN-30) direto da lista de necessidades.
export function DonateButton({
  variantId,
  productName,
}: {
  variantId: string;
  productName: string;
}) {
  const [state, action, pending] = useActionState(addToCart, undefined);
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="variantId" value={variantId} />
      <input type="hidden" name="quantity" value="1" />
      <input type="hidden" name="destino" value="abrigo" />
      <button
        type="submit"
        disabled={pending}
        className={buttonClasses({ variant: "donate", size: "sm" })}
      >
        {pending ? "Adicionando..." : "Doar 1 unidade"}
        <span className="sr-only"> de {productName}</span>
      </button>
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
