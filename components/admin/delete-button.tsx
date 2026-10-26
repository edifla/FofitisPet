"use client";

import { useState, useTransition } from "react";
import type { FormState } from "@/lib/validation/form";

// Botão de exclusão com confirmação. A ação chega já ligada ao id (action.bind(null, id)).
export function DeleteButton({
  action,
  confirmMessage,
  label = "Excluir",
}: {
  action: () => Promise<FormState>;
  confirmMessage: string;
  label?: string;
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
        className="text-sm text-red-700 underline disabled:opacity-60 dark:text-red-400"
      >
        {pending ? "Excluindo..." : label}
      </button>
      {error && (
        <span role="alert" className="text-sm text-red-600">
          {error}
        </span>
      )}
    </span>
  );
}
