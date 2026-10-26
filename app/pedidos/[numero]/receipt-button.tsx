"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/form/field";
import { resendDonationReceipt } from "../actions";

// Reenvio do comprovante de doação por e-mail (KAN-35).
export function ResendReceiptButton({ orderNumber }: { orderNumber: number }) {
  const [state, action, pending] = useActionState(
    resendDonationReceipt.bind(null, orderNumber),
    undefined,
  );
  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <button
        type="submit"
        disabled={pending}
        className="text-sm text-emerald-900 underline disabled:opacity-60 dark:text-emerald-200"
      >
        {pending ? "Enviando..." : "Reenviar comprovante por e-mail"}
      </button>
      <FormMessage message={state?.message} tone={state?.success ? "success" : "error"} />
    </form>
  );
}
