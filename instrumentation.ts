import type { Instrumentation } from "next";

// Erros do servidor (páginas, rotas, Server Actions e proxy) vão para o monitoramento interno
// (KAN-51, tela /admin/erros). Só no runtime Node, onde o Prisma funciona.
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { recordError } = await import("@/lib/monitoring");
  await recordError({
    source: "server",
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : null,
    digest:
      typeof error === "object" && error !== null && "digest" in error
        ? String(error.digest)
        : null,
    routePath: context.routePath,
    path: request.path,
    method: request.method,
    routeType: context.routeType,
  });
};
