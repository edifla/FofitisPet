import Link from "next/link";
import { getCart } from "@/lib/cart";

// Link do carrinho no cabeçalho, com a quantidade de itens. Lê o cookie do carrinho.
export async function CartLink() {
  const { count } = await getCart();
  return (
    <Link href="/carrinho" className="text-sm">
      Carrinho
      {count > 0 && (
        <span className="ml-1 rounded-full bg-zinc-900 px-1.5 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900">
          {count}
        </span>
      )}
      <span className="sr-only"> ({count} item(ns))</span>
    </Link>
  );
}
