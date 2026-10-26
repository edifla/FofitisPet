import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import type { OrderStatus } from "@/app/generated/prisma/client";
import { requireUser } from "@/lib/dal";
import { orderStatusLabels } from "@/lib/labels";
import { formatBRL } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Meus pedidos",
  robots: { index: false },
};

type Props = PageProps<"/conta/pedidos">;

const PAGE_SIZE = 10;

const date = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

const statusTone: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
  PAID: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
  PREPARING: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
  SHIPPED: "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200",
  DELIVERED: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  CANCELED: "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200",
  REFUNDED: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
};

// Histórico de pedidos do cliente (KAN-28), do mais recente para o mais antigo.
export default function OrdersPage({ searchParams }: Props) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <p className="mb-2 text-sm">
        <Link href="/conta" className="underline">
          Minha conta
        </Link>
      </p>
      <h1 className="mb-6 text-2xl font-semibold">Meus pedidos</h1>
      <Suspense fallback={<p className="text-zinc-500">Carregando pedidos...</p>}>
        <OrderList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function OrderList({ searchParams }: Pick<Props, "searchParams">) {
  const user = await requireUser("/conta/pedidos");
  const raw = (await searchParams).pagina;
  const page = Math.max(1, Math.min(1000, Number(Array.isArray(raw) ? raw[0] : raw) || 1));

  const [total, orders] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        number: true,
        status: true,
        destination: true,
        createdAt: true,
        totalCents: true,
        items: { select: { quantity: true } },
      },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (total === 0) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        Você ainda não fez nenhum pedido.{" "}
        <Link href="/produtos" className="underline">
          Ver produtos
        </Link>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {orders.map((order) => {
          const units = order.items.reduce((sum, item) => sum + item.quantity, 0);
          return (
            <li key={order.number}>
              <Link
                href={`/pedidos/${order.number}`}
                className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <span className="flex flex-col">
                  <span className="font-medium">
                    Pedido #{order.number}
                    {order.destination === "SHELTER" && (
                      <span className="ml-2 text-sm font-normal text-zinc-500">
                        Doação ao abrigo
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-zinc-500">
                    {date.format(order.createdAt)} · {units} {units === 1 ? "item" : "itens"}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-0.5 text-sm ${statusTone[order.status]}`}>
                    {order.destination === "SHELTER" && order.status === "DELIVERED"
                      ? "Entregue ao abrigo"
                      : orderStatusLabels[order.status]}
                  </span>
                  <span className="font-medium">{formatBRL(order.totalCents)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {pages > 1 && (
        <nav aria-label="Páginas" className="flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={`/conta/pedidos?pagina=${page - 1}`} className="underline">
              Mais recentes
            </Link>
          ) : (
            <span />
          )}
          <span className="text-zinc-500">
            Página {Math.min(page, pages)} de {pages}
          </span>
          {page < pages ? (
            <Link href={`/conta/pedidos?pagina=${page + 1}`} className="underline">
              Mais antigos
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
