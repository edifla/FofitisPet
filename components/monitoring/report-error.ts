// Envia ao monitoramento interno (KAN-51) um erro que aconteceu no navegador. Erros com digest
// vieram do servidor e já foram registrados pelo onRequestError.
export function reportClientError(error: unknown) {
  if (typeof error === "object" && error !== null && "digest" in error) return;
  const body = JSON.stringify({
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack?.slice(0, 8000) : undefined,
    path: window.location.pathname,
  }).slice(0, 12_000);
  fetch("/api/erros", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export function errorCode(error: unknown) {
  return typeof error === "object" && error !== null && "digest" in error
    ? String(error.digest)
    : null;
}
