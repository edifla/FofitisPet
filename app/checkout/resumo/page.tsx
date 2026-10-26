import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { buildCheckoutSummary } from "@/lib/checkout";
import { requireUser } from "@/lib/dal";
import { formatBRL } from "@/lib/money";
import { formatZipCode } from "@/lib/validation/address";
import { ConfirmOrderForm } from "./confirm-form";

export const metadata: Metadata = {
  title: "Resumo do pedido",
  robots: { index: false },
};

type Props = PageProps<"/checkout/resumo">;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// Passo 2 do checkout (KAN-106): itens, endereço, frete e total antes de confirmar.
export default function CheckoutSummaryPage({ searchParams }: Props) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <p className="text-sm text-zinc-500">Checkout · passo 2 de 2</p>
      <h1 className="mb-6 text-2xl font-semibold">Resumo do pedido</h1>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <Summary searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Summary({ searchParams }: Pick<Props, "searchParams">) {
  const params = await searchParams;
  const addressId = first(params.endereco) ?? "";
  const shippingId = first(params.frete);
  const user = await requireUser(`/checkout/resumo?endereco=${encodeURIComponent(addressId)}`);
  const summary = await buildCheckoutSummary(user.id, addressId, shippingId);

  if (!summary.ok) {
    const messages = {
      "empty-cart": "Seu carrinho está vazio ou sem itens disponíveis.",
      "invalid-address": "Escolha um endereço de entrega válido.",
      "over-stock":
        "Alguns itens do carrinho passaram do estoque disponível. Ajuste as quantidades.",
    };
    const back = summary.reason === "invalid-address" ? "/checkout" : "/carrinho";
    return (
      <div className="flex flex-col items-start gap-3">
        <p role="alert">{messages[summary.reason]}</p>
        <Link href={back} className="font-medium underline">
          {summary.reason === "invalid-address" ? "Escolher endereço" : "Voltar ao carrinho"}
        </Link>
      </div>
    );
  }

  const { address, lines, unavailable, quote, shipping } = summary;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <h2 className="font-medium">Itens</h2>
        <ul className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
          {lines.map((line) => (
            <li key={line.id} className="flex justify-between gap-4 py-2">
              <span>
                {line.quantity}× {line.productName} · {line.variantName}
              </span>
              <span className="font-medium">{formatBRL(line.totalCents)}</span>
            </li>
          ))}
        </ul>
        {unavailable.length > 0 && (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            {unavailable.length} item(ns) indisponível(is) ficam no carrinho e não entram neste
            pedido.
          </p>
        )}
        <Link href="/carrinho" className="text-sm underline">
          Alterar itens
        </Link>
      </section>

      <section className="flex flex-col gap-1 text-sm">
        <h2 className="mb-1 font-medium">Entrega</h2>
        <p>{address.recipientName}</p>
        <p>
          {address.street}, {address.number}
          {address.complement && ` · ${address.complement}`}
        </p>
        <p className="text-zinc-500">
          {address.neighborhood} · {address.city}/{address.state} · CEP{" "}
          {formatZipCode(address.zipCode)}
        </p>
        <Link href="/checkout" className="mt-1 underline">
          Trocar endereço
        </Link>
      </section>

      <form action="/checkout/resumo" className="flex flex-col gap-2">
        <input type="hidden" name="endereco" value={address.id} />
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 font-medium">Frete ({quote.billedKg} kg)</legend>
          {quote.options.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-zinc-300 px-4 py-3 text-sm has-checked:border-zinc-900 dark:border-zinc-700 dark:has-checked:border-zinc-100"
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="frete"
                  value={option.id}
                  defaultChecked={option.id === shipping.id}
                />
                {option.name} · até {option.days} dia(s) útil(eis)
              </span>
              <span className="font-medium">
                {option.priceCents === 0 ? "Grátis" : formatBRL(option.priceCents)}
              </span>
            </label>
          ))}
        </fieldset>
        <div>
          <button type="submit" className="text-sm underline">
            Atualizar frete
          </button>
        </div>
      </form>

      <section className="flex flex-col gap-1 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800">
        <p className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatBRL(summary.subtotalCents)}</span>
        </p>
        <p className="flex justify-between">
          <span>Frete ({shipping.name})</span>
          <span>{shipping.priceCents === 0 ? "Grátis" : formatBRL(shipping.priceCents)}</span>
        </p>
        <p className="mt-2 flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>{formatBRL(summary.totalCents)}</span>
        </p>
      </section>

      <ConfirmOrderForm
        addressId={address.id}
        shippingId={shipping.id}
        totalCents={summary.totalCents}
      />
    </div>
  );
}
