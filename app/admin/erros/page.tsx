import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DeleteButton } from "@/components/admin/delete-button";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { resolveError } from "./actions";

export const metadata: Metadata = { title: "Erros" };

type Props = PageProps<"/admin/erros">;

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

// Erros registrados pelo monitoramento interno (KAN-51).
export default function ErrorsPage({ searchParams }: Props) {
  return (
    <>
      <h1 className="mb-2 text-2xl font-semibold">Erros</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Erros do servidor e do navegador, agrupados. Ocorrências iguais só aumentam o contador.
      </p>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <ErrorList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ErrorList({ searchParams }: Pick<Props, "searchParams">) {
  await requireAdmin();
  const showResolved = (await searchParams).resolvidos === "sim";
  const errors = await prisma.errorLog.findMany({
    where: { resolvedAt: showResolved ? { not: null } : null },
    orderBy: { lastSeenAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex gap-4 text-sm" aria-label="Filtrar erros">
        <Link
          href="/admin/erros"
          aria-current={showResolved ? undefined : "page"}
          className="aria-[current=page]:font-semibold"
        >
          Abertos
        </Link>
        <Link
          href="/admin/erros?resolvidos=sim"
          aria-current={showResolved ? "page" : undefined}
          className="aria-[current=page]:font-semibold"
        >
          Resolvidos
        </Link>
      </nav>
      {errors.length === 0 ? (
        <p className="text-zinc-500">
          {showResolved ? "Nenhum erro resolvido." : "Nenhum erro aberto. Tudo certo por aqui."}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {errors.map((error) => (
            <li key={error.id} className="flex flex-col gap-1 py-3 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium break-all">{error.message}</span>
                <span className="text-zinc-500">
                  {error.count}× · última em {dateTime.format(error.lastSeenAt)}
                </span>
              </div>
              <span className="text-zinc-500">
                {error.source === "server" ? "Servidor" : "Navegador"}
                {error.routeType && ` · ${error.routeType}`}
                {error.method && ` · ${error.method}`}
                {(error.routePath || error.path) && ` · ${error.routePath ?? error.path}`}
                {error.path && error.routePath && ` (${error.path})`}
                {error.digest && ` · código ${error.digest}`}
                {` · desde ${dateTime.format(error.firstSeenAt)}`}
              </span>
              {error.stack && (
                <details>
                  <summary className="cursor-pointer text-zinc-500">Detalhes</summary>
                  <pre className="mt-2 overflow-x-auto rounded bg-zinc-100 p-2 text-xs dark:bg-zinc-900">
                    {error.stack}
                  </pre>
                </details>
              )}
              {!error.resolvedAt && (
                <DeleteButton
                  action={resolveError.bind(null, error.id)}
                  confirmMessage="Marcar este erro como resolvido?"
                  label="Marcar como resolvido"
                  pendingLabel="Salvando..."
                  tone="neutral"
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
