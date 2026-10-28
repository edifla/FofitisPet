"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormMessage } from "@/components/form/field";
import { donateKit } from "./actions";
import { buttonClasses } from "@/components/ui/button";

export function DonateKitButton({ kitId, kitName }: { kitId: string; kitName: string }) {
  const [state, action, pending] = useActionState(donateKit.bind(null, kitId), undefined);
  return (
    <form action={action} className="flex flex-col gap-2">
      <button
        type="submit"
        disabled={pending}
        className={buttonClasses({ variant: "donate", size: "sm" })}
      >
        {pending ? "Adicionando..." : "Doar este kit"}
        <span className="sr-only"> ({kitName})</span>
      </button>
      {state?.message && (
        <div className="flex flex-wrap items-center gap-3">
          <FormMessage message={state.message} tone={state.success ? "success" : "error"} />
          {state.success && (
            <Link href="/checkout/doacao" className="text-sm font-medium underline">
              Finalizar doação
            </Link>
          )}
        </div>
      )}
    </form>
  );
}
