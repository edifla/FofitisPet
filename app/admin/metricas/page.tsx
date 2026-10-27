import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Panel, StatTile } from "@/components/admin/panel";
import { BarList } from "@/components/charts/bar-list";
import { TimeChart } from "@/components/charts/time-chart";
import { cn } from "@/components/ui/cn";
import {
  AlertIcon,
  BagIcon,
  EyeIcon,
  GiftIcon,
  HeartIcon,
  PawOutlineIcon,
} from "@/components/ui/icons";
import { adoptionStatusLabels } from "@/lib/adoption-flow";
import { getMetrics, METRICS_RANGES, parseMetricsDays } from "@/lib/admin/metrics";
import { formatBRL } from "@/lib/money";

export const metadata: Metadata = { title: "Métricas" };

type Props = PageProps<"/admin/metricas">;

// Métricas de uso e do negócio (KAN-51), sem serviço externo: visualizações anônimas, vendas,
// doações e adoções, com gráficos por dia e filtro de período.
export default function MetricsPage({ searchParams }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Métricas</h1>
        <p className="text-sm text-zinc-500">
          Como a loja, as doações e a adoção estão indo. Contagem anônima, sem cookies.
        </p>
      </div>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <Metrics searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const shortDay = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

async function Metrics({ searchParams }: Pick<Props, "searchParams">) {
  const days = parseMetricsDays((await searchParams).dias);
  const m = await getMetrics(days);
  const totalViews = m.daily.reduce((sum, d) => sum + d.views, 0);

  return (
    <>
      {/* Período: vale para todos os números e gráficos abaixo. */}
      <nav aria-label="Período" className="flex flex-wrap items-center gap-2">
        {METRICS_RANGES.map((range) => (
          <Link
            key={range}
            href={`/admin/metricas?dias=${range}`}
            aria-current={range === days ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium ring-1 transition-colors",
              range === days
                ? "bg-primary text-on-primary ring-primary"
                : "bg-surface ring-zinc-200 hover:bg-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-800",
            )}
          >
            Últimos {range} dias
          </Link>
        ))}
      </nav>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Visualizações"
          value={totalViews.toLocaleString("pt-BR")}
          detail={`${m.signups} conta(s) nova(s)`}
          Icon={EyeIcon}
        />
        <StatTile
          label="Vendas pagas"
          value={formatBRL(m.sales._sum.totalCents ?? 0)}
          detail={`${m.sales._count._all} pedido(s)`}
          Icon={BagIcon}
        />
        <StatTile
          label="Doações entregues"
          value={formatBRL(m.donations._sum.totalCents ?? 0)}
          detail={`${m.donations._count._all} doação(ões)`}
          Icon={GiftIcon}
          tone="donate"
        />
        <StatTile
          label="Pedidos de adoção"
          value={String(m.adoptionRequests)}
          detail={`${m.approved} aprovada(s)`}
          href="/admin/adocoes"
          Icon={HeartIcon}
          tone="adopt"
        />
      </div>

      <Panel title="Visualizações por dia" description="Páginas abertas por visitantes reais.">
        <TimeChart
          title="Visualizações por dia"
          data={m.daily.map((d) => ({ label: shortDay(d.day), value: d.views }))}
        />
      </Panel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Vendas por dia" description="Valor dos pedidos pagos da loja.">
          <TimeChart
            title="Vendas por dia"
            kind="columns"
            format="brl"
            data={m.daily.map((d) => ({ label: shortDay(d.day), value: d.salesCents }))}
          />
        </Panel>
        <Panel title="Doações por dia" description="Valor das compras pagas para o abrigo.">
          <TimeChart
            title="Doações por dia"
            kind="columns"
            format="brl"
            tone="donate"
            data={m.daily.map((d) => ({ label: shortDay(d.day), value: d.donationsCents }))}
          />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Páginas mais vistas">
          <BarList
            title="Páginas mais vistas"
            items={m.topPages.map((row) => ({
              key: row.path,
              label: <span className="font-mono text-xs">{row.path}</span>,
              value: row._sum.views ?? 0,
            }))}
          />
        </Panel>
        <Panel
          title="Pedidos de adoção por situação"
          action={
            <Link href="/admin/adocoes" className="text-sm text-brand-text hover:underline">
              Ver todos
            </Link>
          }
        >
          <BarList
            title="Pedidos de adoção por situação"
            tone="adopt"
            items={m.requestsByStatus
              .sort((a, b) => b.count - a.count)
              .map((row) => ({
                key: row.status,
                label: adoptionStatusLabels[row.status],
                value: row.count,
              }))}
          />
        </Panel>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-zinc-100/70 px-5 py-4 text-sm text-zinc-600 dark:bg-zinc-900/60 dark:text-zinc-400">
        <PawOutlineIcon className="size-5 text-brand-text" />
        <p className="flex-1">
          A contagem é anônima: guarda só a página e o dia. Bots e navegadores com &quot;Não
          rastrear&quot; ligado não entram.
        </p>
        <Link
          href="/admin/erros"
          className="inline-flex items-center gap-1.5 font-medium text-brand-text hover:underline"
        >
          <AlertIcon className="size-4" />
          {m.openErrors} erro(s) em aberto
        </Link>
      </div>
    </>
  );
}
