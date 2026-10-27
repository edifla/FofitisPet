"use client";

import { useState, useTransition } from "react";
import { TrashIcon } from "@/components/ui/icons";
import type { FormState } from "@/lib/validation/form";

// Botão de exclusão com confirmação. A ação chega já ligada ao id (action.bind(null, id)).
// Com tone="neutral", serve para outras ações confirmadas (ex.: marcar erro como resolvido).
export function DeleteButton({
  action,
  confirmMessage,
  label = "Excluir",
  pendingLabel = "Excluindo...",
  tone = "danger",
  appearance = "link",
}: {
  action: () => Promise<FormState>;
  confirmMessage: string;
  label?: string;
  pendingLabel?: string;
  tone?: "danger" | "neutral";
  // "button": botão com ícone de lixeira, para as linhas das tabelas.
  appearance?: "link" | "button";
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(confirmMessage)) return;
          setError(undefined);
          startTransition(async () => {
            const result = await action();
            if (result?.message && !result.success) setError(result.message);
          });
        }}
        className={
          appearance === "button"
            ? "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/50"
            : tone === "danger"
              ? "text-sm text-red-700 underline disabled:opacity-60 dark:text-red-400"
              : "text-sm underline disabled:opacity-60"
        }
      >
        {appearance === "button" && <TrashIcon className="size-4" />}
        {pending ? pendingLabel : label}
      </button>
      {error && (
        <span role="alert" className="text-sm text-red-600">
          {error}
        </span>
      )}
    </span>
  );
}
