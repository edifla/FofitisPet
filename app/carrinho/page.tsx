import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getCart } from "@/lib/cart";
import { formatBRL } from "@/lib/money";
import { removeFromCart } from "./actions";

export const metadata: Metadata = {
  title: "Carrinho",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Carrinho</h1>
      <Suspense fallback={<p className="text-zinc-500">Carregando carrinho...</p>}>
        <CartContents />
      </Suspense>
    </main>
  );
}

async function CartContents() {
  const { items, subtotalCents } = await getCart();

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
    <div className="flex flex-col gap-6">
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
            </div>
            <div className="flex flex-col items-end gap-1 text-right">
              <p className="text-sm text-zinc-500">Qtd. {item.quantity}</p>
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
      <div className="flex flex-col items-end gap-1 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <p className="text-sm text-zinc-500">Subtotal</p>
        <p className="text-2xl font-semibold">{formatBRL(subtotalCents)}</p>
        <p className="text-sm text-zinc-500">O frete é calculado no checkout.</p>
      </div>
    </div>
  );
}
