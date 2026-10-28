"use client";

import { useTransition } from "react";
import { setDefaultAddress } from "../profile-actions";

// Botão "Tornar padrão" de um endereço da lista.
export function MakeDefaultButton({ addressId }: { addressId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => void (await setDefaultAddress(addressId)))}
      className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-brand-text hover:bg-brand-50 disabled:opacity-60 dark:hover:bg-brand-900/40"
    >
      {pending ? "Salvando..." : "Tornar padrão"}
    </button>
  );
}
