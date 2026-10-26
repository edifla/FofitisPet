import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { type CartLine, getCart, MAX_QUANTITY_PER_ITEM } from "@/lib/cart";
import { formatBRL } from "@/lib/money";
import { quoteShipping, type ShippingQuote } from "@/lib/shipping";
import { moveCartItem, removeFromCart } from "./actions";
import { QuantityForm } from "./quantity-form";

export const metadata: Metadata = {
  title: "Carrinho",
  robots: { index: false },
};

type Props = PageProps<"/carrinho">;

export default function CartPage({ searchParams }: Props) {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Carrinho</h1>
      <Suspense fallback={<p className="text-zinc-500">Carregando carrinho...</p>}>
        <CartContents searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function CartContents({ searchParams }: Pick<Props, "searchParams">) {
  const [cart, params] = await Promise.all([getCart(), searchParams]);
  const { items, subtotalCents, donationSubtotalCents, purchaseCount, donationCount } = cart;
  const cep = typeof params.cep === "string" ? params.cep.slice(0, 9) : "";
  const purchase = items.filter((item) => !item.donation);
  const donation = items.filter((item) => item.donation);
  const quote =
    cep && purchaseCount > 0
      ? quoteShipping({
          zipCode: cep,
          items: purchase
            .filter((item) => item.available)
            .map((item) => ({ weightGrams: item.weightGrams, quantity: item.quantity })),
          subtotalCents,
        })
      : null;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p>Seu carrinho está vazio.</p>
        <Link href="/produtos" className="font-medium underline">
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {purchase.length > 0 && (
        <section className="flex flex-col gap-4" aria-labelledby="compra">
          {donation.length > 0 && (
            <h2 id="compra" className="text-lg font-semibold">
              Para você
            </h2>
          )}
          <CartItems items={purchase} />
          <div className="flex flex-col items-end gap-1 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <p className="text-sm text-zinc-500">Subtotal</p>
            <p className="text-2xl font-semibold">{formatBRL(subtotalCents)}</p>
            <ShippingEstimate cep={cep} quote={quote} />
            {purchaseCount > 0 && (
              <Link
                href="/checkout"
                className="mt-2 rounded-md bg-zinc-900 px-6 py-2 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Continuar para o checkout
              </Link>
            )}
          </div>
        </section>
      )}

      {donation.length > 0 && (
        <section
          className="flex flex-col gap-4 rounded-lg border border-emerald-300 p-4 dark:border-emerald-800"
          aria-labelledby="doacao"
        >
          <div>
            <h2 id="doacao" className="text-lg font-semibold">
              Para o abrigo
            </h2>
            <p className="text-sm text-zinc-500">
              Estes itens vão direto para o abrigo da FofitisPet, sem frete e sem endereço.
            </p>
          </div>
          <CartItems items={donation} />
          <div className="flex flex-col items-end gap-1 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <p className="text-sm text-zinc-500">Total da doação</p>
            <p className="text-2xl font-semibold">{formatBRL(donationSubtotalCents)}</p>
            {donationCount > 0 && (
              <Link
                href="/checkout/doacao"
                className="mt-2 rounded-md bg-emerald-700 px-6 py-2 font-medium text-white"
              >
                Finalizar doação
              </Link>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function CartItems({ items }: { items: CartLine[] }) {
  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {items.map((item) => (
        <li key={item.id} className="flex gap-4 py-4">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-900">
            {item.image && (
              <Image
                src={item.image.url}
                alt={item.image.alt ?? item.productName}
                fill
                sizes="5rem"
                className="object-cover"
              />
            )}
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <Link href={`/produtos/${item.productSlug}`} className="font-medium hover:underline">
              {item.productName}
            </Link>
            <p className="text-sm text-zinc-500">
              {item.variantName} · {formatBRL(item.unitPriceCents)} cada
            </p>
            {!item.available && (
              <p className="text-sm text-red-600">Indisponível no momento. Não entra no total.</p>
            )}
            {item.overStock && (
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Só há {item.stock} unidade(s) disponível(is).
              </p>
            )}
            {(item.donation || item.donationEligible) && (
              <form action={moveCartItem.bind(null, item.id, !item.donation)}>
                <button
                  type="submit"
                  className="text-sm text-emerald-800 underline dark:text-emerald-300"
                >
                  {item.donation ? "Receber em casa em vez de doar" : "Doar para o abrigo"}
                  <span className="sr-only"> {item.productName}</span>
                </button>
              </form>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            {item.available ? (
              <QuantityForm
                itemId={item.id}
                quantity={item.quantity}
                max={Math.min(item.stock, MAX_QUANTITY_PER_ITEM)}
                productName={item.productName}
              />
            ) : (
              <p className="text-sm text-zinc-500">Qtd. {item.quantity}</p>
            )}
            <p className="font-semibold">{formatBRL(item.totalCents)}</p>
            <form action={removeFromCart.bind(null, item.id)}>
              <button type="submit" className="text-sm text-red-700 underline dark:text-red-400">
                Remover<span className="sr-only"> {item.productName}</span>
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}

// Simulação de frete pelo CEP (KAN-27). O valor final é escolhido no checkout.
function ShippingEstimate({ cep, quote }: { cep: string; quote: ShippingQuote | null }) {
  return (
    <div className="flex w-full max-w-sm flex-col items-end gap-2 pt-2">
      <form action="/carrinho" className="flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="cep" className="text-sm text-zinc-500">
            Calcular frete
          </label>
          <input
            id="cep"
            name="cep"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="CEP"
            defaultValue={cep}
            className="w-32 rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          Calcular
        </button>
      </form>
      {cep && !quote && <p className="text-sm text-red-600">CEP inválido.</p>}
      {quote && (
        <ul className="w-full text-sm">
          {quote.options.map((option) => (
            <li key={option.id} className="flex justify-between gap-4">
              <span>
                {option.name} · até {option.days} dia(s) útil(eis)
              </span>
              <span className="font-medium">
                {option.priceCents === 0 ? "Grátis" : formatBRL(option.priceCents)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {quote && quote.missingForFreeCents > 0 && (
        <p className="text-sm text-zinc-500">
          Faltam {formatBRL(quote.missingForFreeCents)} para o frete Econômica grátis.
        </p>
      )}
    </div>
  );
}
