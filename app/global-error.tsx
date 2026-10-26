"use client";

import { useEffect } from "react";
import { errorCode, reportClientError } from "@/components/monitoring/report-error";

// Erro no layout principal (KAN-51): substitui a página inteira, sem os estilos do site.
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => reportClientError(error), [error]);
  const code = errorCode(error);
  return (
    <html lang="pt-BR">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          padding: "4rem 1rem",
          maxWidth: 560,
          margin: "0 auto",
        }}
      >
        <title>Algo deu errado | FofitisPet</title>
        <h1>Algo deu errado</h1>
        <p>Já registramos o problema. Tente de novo; se continuar, volte mais tarde.</p>
        {code && <p>Código do erro: {code}</p>}
        <button type="button" onClick={() => retry()}>
          Tentar de novo
        </button>
      </body>
    </html>
  );
}
