import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/dal";
import { orderStatusLabels } from "@/lib/labels";
import { formatBRL } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { formatZipCode } from "@/lib/validation/address";

export const metadata: Metadata = {
  title: "Pedido",
  robots: { index: false },
};

type Props = PageProps<"/pedidos/[numero]">;

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" });

// Página do pedido (KAN-107). Só o dono do pedido (ou um admin) vê.
export default function OrderPage({ params }: Props) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Suspense fallback={<p className="text-zinc-500">Carregando pedido...</p>}>
        <OrderDetails params={params} />
      </Suspense>
    </main>
  );
}

async function OrderDetails({ params }: Pick<Props, "params">) {
  const { numero } = await params;
  const number = Number(numero);
  const user = await requireUser(`/pedidos/${numero}`);
  if (!Number.isInteger(number) || number < 1) notFound();

  const order = await prisma.order.findFirst({
    where: { number, ...(user.role === "ADMIN" ? {} : { userId: user.id }) },
    select: {
      number: true,
      status: true,
      createdAt: true,
      subtotalCents: true,
      shippingCents: true,
      discountCents: true,
      totalCents: true,
      shippingRecipientName: true,
      shippingZipCode: true,
      shippingStreet: true,
      shippingNumber: true,
      shippingComplement: true,
      shippingNeighborhood: true,
      shippingCity: true,
      shippingState: true,
      shippingMethod: true,
      items: {
        orderBy: { productName: "asc" },
        select: {
          id: true,
          productName: true,
          variantName: true,
          quantity: true,
          unitPriceCents: true,
          totalCents: true,
        },
      },
    },
  });
  // Pedido de outra pessoa aparece como inexistente.
  if (!order) notFound();

  return (
    <article className="flex flex-col gap-8">
      <header>
        <p className="text-sm text-zinc-500">{dateTime.format(order.createdAt)}</p>
        <h1 className="text-2xl font-semibold">Pedido #{order.number}</h1>
        <p className="mt-1 inline-block rounded-full bg-amber-100 px-3 py-0.5 text-sm text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
          {orderStatusLabels[order.status]}
        </p>
      </header>

      {order.status === "PENDING_PAYMENT" && (
        <p className="rounded-md bg-zinc-100 p-4 text-sm dark:bg-zinc-900">
          Recebemos seu pedido e os itens estão reservados. O pagamento por Pix ou cartão entra na
          próxima etapa do projeto (KAN-26).
        </p>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-medium">Itens</h2>
        <ul className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-2">
              <span>
                {item.quantity}× {item.productName} · {item.variantName}
                <span className="block text-zinc-500">{formatBRL(item.unitPriceCents)} cada</span>
              </span>
              <span className="font-medium">{formatBRL(item.totalCents)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-1 text-sm">
        <h2 className="mb-1 font-medium">Entrega</h2>
        <p>{order.shippingRecipientName}</p>
        <p>
          {order.shippingStreet}, {order.shippingNumber}
          {order.shippingComplement && ` · ${order.shippingComplement}`}
        </p>
        <p className="text-zinc-500">
          {order.shippingNeighborhood} · {order.shippingCity}/{order.shippingState}
          {order.shippingZipCode && ` · CEP ${formatZipCode(order.shippingZipCode)}`}
        </p>
        {order.shippingMethod && <p className="text-zinc-500">{order.shippingMethod}</p>}
      </section>

      <section className="flex flex-col gap-1 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800">
        <p className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatBRL(order.subtotalCents)}</span>
        </p>
        <p className="flex justify-between">
          <span>Frete</span>
          <span>{order.shippingCents === 0 ? "Grátis" : formatBRL(order.shippingCents)}</span>
        </p>
        {order.discountCents > 0 && (
          <p className="flex justify-between">
            <span>Desconto</span>
            <span>−{formatBRL(order.discountCents)}</span>
          </p>
        )}
        <p className="mt-2 flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{formatBRL(order.totalCents)}</span>
        </p>
      </section>

      <Link href="/produtos" className="text-sm underline">
        Continuar comprando
      </Link>
    </article>
  );
}
