import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Panel, StatTile } from "@/components/admin/panel";
import { TimeChart } from "@/components/charts/time-chart";
import { cn } from "@/components/ui/cn";
import {
  AlertIcon,
  BagIcon,
  BoxIcon,
  ChatIcon,
  GiftIcon,
  HeartIcon,
  MegaphoneIcon,
  PawOutlineIcon,
  PlusIcon,
} from "@/components/ui/icons";
import { table, tableClasses } from "@/components/ui/table";
import { getDashboard, getMetrics } from "@/lib/admin/metrics";
import { requireAdmin } from "@/lib/dal";
import { orderStatusLabels } from "@/lib/labels";
import { formatBRL } from "@/lib/money";

export const metadata: Metadata = {
  title: "Administração",
  robots: { index: false },
};

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});
const shortDay = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

const SHORTCUTS = [
  { href: "/admin/produtos/novo", label: "Novo produto", Icon: BagIcon },
  { href: "/admin/animais/novo", label: "Cadastrar animal", Icon: PawOutlineIcon },
  { href: "/admin/campanhas/nova", label: "Nova campanha", Icon: MegaphoneIcon },
  { href: "/admin/kits/novo", label: "Novo kit de doação", Icon: GiftIcon },
];

export default function AdminHomePage() {
  return (
    <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const admin = await requireAdmin("/admin");
  const [d, m] = await Promise.all([getDashboard(), getMetrics(30)]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-brand-text">Painel</p>
          <h1 className="text-2xl font-bold tracking-tight">
            Olá, {admin.name.split(" ")[0]}! Aqui está o resumo de hoje.
          </h1>
        </div>
        <Link
          href="/admin/metricas"
          className="text-sm font-medium text-brand-text hover:underline"
        >
          Ver todas as métricas →
        </Link>
      </div>

      {/* O que precisa de atenção agora. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Pedidos para enviar" value={String(d.toShip)} Icon={BagIcon} />
        <StatTile
          label="Adoções para analisar"
          value={String(d.newRequests)}
          href="/admin/adocoes?status=recebido"
          Icon={HeartIcon}
          tone="adopt"
        />
        <StatTile
          label="Estoque baixo"
          value={String(d.lowStock)}
          href="/admin/estoque?baixo=1"
          Icon={BoxIcon}
          tone="amber"
        />
        <StatTile
          label="Feedbacks novos"
          value={String(d.newFeedback)}
          href="/admin/feedback"
          Icon={ChatIcon}
          tone="zinc"
        />
        <StatTile
          label="Erros em aberto"
          value={String(d.openErrors)}
          href="/admin/erros"
          Icon={AlertIcon}
          tone={d.openErrors > 0 ? "donate" : "zinc"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel
          title="Vendas nos últimos 30 dias"
          description={`${formatBRL(m.sales._sum.totalCents ?? 0)} em ${m.sales._count._all} pedido(s) pagos`}
          className="xl:col-span-2"
        >
          <TimeChart
            title="Vendas por dia nos últimos 30 dias"
            kind="columns"
            format="brl"
            data={m.daily.map((day) => ({ label: shortDay(day.day), value: day.salesCents }))}
          />
        </Panel>
        <Panel title="Atalhos">
          <ul className="grid grid-cols-1 gap-2">
            {SHORTCUTS.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ring-1 ring-zinc-200 transition-colors hover:bg-brand-50 hover:ring-brand-200 dark:ring-zinc-800 dark:hover:bg-brand-900/30"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-800 dark:bg-brand-900/50 dark:text-brand-100">
                    <Icon className="size-4" />
                  </span>
                  {label}
                  <PlusIcon className="ml-auto size-4 text-zinc-400" />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Últimos pedidos pagos">
        {d.recentOrders.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhum pedido pago ainda.</p>
        ) : (
          <div className={cn(table.wrap, "shadow-none")}>
            <table className={table.table}>
              <caption className="sr-only">Últimos pedidos pagos</caption>
              <thead className={table.head}>
                <tr>
                  <th className={table.th}>Pedido</th>
                  <th className={table.th}>Cliente</th>
                  <th className={table.th}>Tipo</th>
                  <th className={table.th}>Situação</th>
                  <th className={table.th}>Pago em</th>
                  <th className={tableClasses("th", "text-right")}>Total</th>
                </tr>
              </thead>
              <tbody>
                {d.recentOrders.map((order) => (
                  <tr key={order.id} className={table.row}>
                    <td className={tableClasses("td", "font-semibold tabular-nums")}>
                      #{order.number}
                    </td>
                    <td className={table.td}>{order.user.name}</td>
                    <td className={table.td}>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          order.destination === "SHELTER"
                            ? "bg-donate-100 text-donate-800 dark:bg-donate-950 dark:text-donate-200"
                            : "bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-100",
                        )}
                      >
                        {order.destination === "SHELTER" ? "Doação" : "Compra"}
                      </span>
                    </td>
                    <td className={table.td}>{orderStatusLabels[order.status]}</td>
                    <td className={tableClasses("td", "text-zinc-600 dark:text-zinc-400")}>
                      {order.paidAt ? dateTime.format(order.paidAt) : "—"}
                    </td>
                    <td className={tableClasses("td", "text-right font-semibold tabular-nums")}>
                      {formatBRL(order.totalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
