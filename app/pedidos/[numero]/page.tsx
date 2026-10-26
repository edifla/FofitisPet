import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { OrderStatus } from "@/app/generated/prisma/client";
import { requireUser } from "@/lib/dal";
import { orderStatusLabels } from "@/lib/labels";
import { expireOrderIfStale, paymentDeadline } from "@/lib/orders";
import { formatBRL } from "@/lib/money";
import { simulatedPaymentsAllowed, usingSimulatedGateway } from "@/lib/payments";
import { SIMULATED_PROVIDER, TEST_CARD_LIST, TEST_HOLDER_NAMES } from "@/lib/payments/simulated";
import { prisma } from "@/lib/prisma";
import { formatZipCode } from "@/lib/validation/address";
import { MAX_INSTALLMENTS } from "@/lib/validation/card";
import { CardPaymentForm } from "./card-payment";
import { PixCode, SimulatePixForm, StartPixForm } from "./pix-payment";

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

  const scope = { number, ...(user.role === "ADMIN" ? {} : { userId: user.id }) };
  // Pedido não pago fora do prazo é cancelado aqui mesmo, sem esperar a rotina periódica.
  await expireOrderIfStale(scope);

  const order = await prisma.order.findFirst({
    where: scope,
    select: {
      number: true,
      userId: true,
      status: true,
      createdAt: true,
      paidAt: true,
      canceledAt: true,
      cancelReason: true,
      payments: {
        // Pix ainda válido e o pagamento aprovado, se houver.
        where: {
          OR: [
            { method: "PIX", status: "PENDING", pixExpiresAt: { gt: new Date() } },
            { status: "APPROVED" },
          ],
        },
        orderBy: { createdAt: "desc" },
        select: {
          provider: true,
          method: true,
          status: true,
          pixQrCode: true,
          pixExpiresAt: true,
          cardBrand: true,
          cardLastFour: true,
          installments: true,
        },
      },
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

      <PaymentSection
        orderNumber={order.number}
        status={order.status}
        paidAt={order.paidAt}
        createdAt={order.createdAt}
        canceledAt={order.canceledAt}
        cancelReason={order.cancelReason}
        totalCents={order.totalCents}
        isOwner={order.userId === user.id}
        payments={order.payments}
      />

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

const time = new Intl.DateTimeFormat("pt-BR", {
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

const brandLabels: Record<string, string> = {
  visa: "Visa",
  master: "Mastercard",
  amex: "American Express",
  elo: "Elo",
};

type PaymentRow = {
  provider: string;
  method: "PIX" | "CREDIT_CARD";
  status: string;
  pixQrCode: string | null;
  pixExpiresAt: Date | null;
  cardBrand: string | null;
  cardLastFour: string | null;
  installments: number | null;
};

// Pagamento do pedido (KAN-26). Só o dono paga; o admin só vê a situação.
function PaymentSection({
  orderNumber,
  status,
  paidAt,
  createdAt,
  canceledAt,
  cancelReason,
  totalCents,
  isOwner,
  payments,
}: {
  orderNumber: number;
  status: OrderStatus;
  paidAt: Date | null;
  createdAt: Date;
  canceledAt: Date | null;
  cancelReason: string | null;
  totalCents: number;
  isOwner: boolean;
  payments: PaymentRow[];
}) {
  if (status === "PAID") {
    const approved = payments.find((payment) => payment.status === "APPROVED");
    const how =
      approved?.method === "CREDIT_CARD"
        ? ` no cartão ${brandLabels[approved.cardBrand ?? ""] ?? ""} final ${approved.cardLastFour}` +
          (approved.installments && approved.installments > 1
            ? ` em ${approved.installments}x`
            : "")
        : approved?.method === "PIX"
          ? " via Pix"
          : "";
    return (
      <p className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
        Pagamento aprovado{how}
        {paidAt && ` em ${dateTime.format(paidAt)}`}. Já estamos separando seu pedido.
      </p>
    );
  }
  if (status === "CANCELED") {
    return (
      <p className="rounded-md bg-red-50 p-4 text-sm text-red-900 dark:bg-red-950 dark:text-red-200">
        Pedido cancelado{canceledAt && ` em ${dateTime.format(canceledAt)}`}
        {cancelReason && `: ${cancelReason.toLowerCase()}`}. Os itens voltaram para o estoque.
        {payments.some((payment) => payment.status === "APPROVED")
          ? " Recebemos um pagamento depois do cancelamento: ele será estornado."
          : " Nenhum valor foi cobrado."}
      </p>
    );
  }
  if (status !== "PENDING_PAYMENT") return null;
  if (!isOwner) {
    return (
      <section className="rounded-md bg-zinc-100 p-4 text-sm dark:bg-zinc-900">
        <h2 className="font-medium">Pagamento</h2>
        <p>Aguardando o pagamento do cliente.</p>
      </section>
    );
  }

  const pix = payments.find((payment) => payment.method === "PIX" && payment.status === "PENDING");
  const simulated = usingSimulatedGateway();
  const installmentOptions = Array.from({ length: MAX_INSTALLMENTS }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1}x de ${formatBRL(Math.ceil(totalCents / (i + 1)))} sem juros`,
  }));

  return (
    <section className="flex flex-col gap-6 rounded-md bg-zinc-100 p-4 text-sm dark:bg-zinc-900">
      <div className="flex flex-col gap-4">
        <h2 className="font-medium">Pagar com Pix</h2>
        {pix?.pixQrCode ? (
          <>
            <p>
              Copie o código abaixo e pague no app do seu banco
              {pix.pixExpiresAt && <> até as {time.format(pix.pixExpiresAt)}</>}. A confirmação é
              automática.
            </p>
            <PixCode code={pix.pixQrCode} />
            {pix.provider === SIMULATED_PROVIDER && simulatedPaymentsAllowed() && (
              <SimulatePixForm orderNumber={orderNumber} />
            )}
          </>
        ) : (
          <>
            <p>
              Os itens estão reservados para você até as {time.format(paymentDeadline(createdAt))}.
              Pague com Pix ou cartão para confirmar.
            </p>
            <StartPixForm orderNumber={orderNumber} />
          </>
        )}
      </div>
      <div className="flex flex-col gap-4 border-t border-zinc-300 pt-6 dark:border-zinc-700">
        <h2 className="font-medium">Pagar com cartão de crédito</h2>
        <CardPaymentForm
          orderNumber={orderNumber}
          installmentOptions={installmentOptions}
          testCards={
            simulated ? { cards: TEST_CARD_LIST, holderNames: TEST_HOLDER_NAMES } : undefined
          }
        />
      </div>
    </section>
  );
}
