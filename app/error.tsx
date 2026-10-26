"use client";

import Link from "next/link";
import { useEffect } from "react";
import { errorCode, reportClientError } from "@/components/monitoring/report-error";

// Tela de erro das páginas (KAN-51): registra o erro e oferece tentar de novo.
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => reportClientError(error), [error]);
  const code = errorCode(error);
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-start gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">Algo deu errado</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Já registramos o problema. Tente de novo; se continuar, volte mais tarde.
      </p>
      {code && <p className="text-sm text-zinc-500">Código do erro: {code}</p>}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Tentar de novo
        </button>
        <Link href="/" className="self-center underline">
          Ir para o início
        </Link>
      </div>
    </main>
  );
}
