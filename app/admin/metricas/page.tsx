import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getMetrics, METRICS_DAYS } from "@/lib/admin/metrics";
import { formatBRL } from "@/lib/money";

export const metadata: Metadata = { title: "Métricas" };

const day = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });

// Métricas básicas de uso (KAN-51): visualizações anônimas e números do negócio, sem serviço
// externo.
export default function MetricsPage() {
  return (
    <>
      <h1 className="mb-2 text-2xl font-semibold">Métricas</h1>
      <p className="mb-6 text-sm text-zinc-500">Últimos {METRICS_DAYS} dias.</p>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <Metrics />
      </Suspense>
    </>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd className="text-2xl font-semibold">
        {href ? (
          <Link href={href} className="hover:underline">
            {value}
          </Link>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

async function Metrics() {
  const {
    viewsByDay,
    topPages,
    signups,
    sales,
    donations,
    adoptionRequests,
    approved,
    openErrors,
  } = await getMetrics();

  const totalViews = viewsByDay.reduce((sum, row) => sum + (row._sum.views ?? 0), 0);
  const maxViews = Math.max(1, ...viewsByDay.map((row) => row._sum.views ?? 0));

  return (
    <div className="flex flex-col gap-8">
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Visualizações de página" value={String(totalViews)} />
        <Stat label="Contas criadas" value={String(signups)} />
        <Stat
          label={`Vendas pagas (${sales._count._all})`}
          value={formatBRL(sales._sum.totalCents ?? 0)}
        />
        <Stat
          label={`Doações entregues (${donations._count._all})`}
          value={formatBRL(donations._sum.totalCents ?? 0)}
        />
        <Stat
          label="Solicitações de adoção"
          value={String(adoptionRequests)}
          href="/admin/adocoes"
        />
        <Stat label="Adoções aprovadas" value={String(approved)} />
        <Stat label="Erros em aberto" value={String(openErrors)} href="/admin/erros" />
      </dl>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">Visualizações por dia</h2>
        {viewsByDay.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhuma visualização registrada ainda.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {viewsByDay.map((row) => {
              const views = row._sum.views ?? 0;
              return (
                <li key={row.day.toISOString()} className="flex items-center gap-2">
                  <span className="w-12 text-zinc-500">{day.format(row.day)}</span>
                  <span
                    aria-hidden
                    className="h-3 rounded bg-emerald-600"
                    style={{ width: `${(views / maxViews) * 70}%` }}
                  />
                  <span>{views}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">Páginas mais vistas</h2>
        {topPages.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhuma visualização registrada ainda.</p>
        ) : (
          <table className="text-left text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-1 pr-4 font-normal">Página</th>
                <th className="py-1 text-right font-normal">Visualizações</th>
              </tr>
            </thead>
            <tbody>
              {topPages.map((row) => (
                <tr key={row.path} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="py-1 pr-4 break-all">{row.path}</td>
                  <td className="py-1 text-right">{row._sum.views ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <p className="text-sm text-zinc-500">
        A contagem é anônima: guarda só a página e o dia, sem cookies nem dados de quem visitou.
        Bots e navegadores com &quot;Não rastrear&quot; ligado não entram.
      </p>
    </div>
  );
}
