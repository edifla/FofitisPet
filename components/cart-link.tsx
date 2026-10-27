import Link from "next/link";
import { CartIcon } from "@/components/ui/icons";
import { getCart } from "@/lib/cart";

// Carrinho no cabeçalho: ícone com a quantidade de itens. Lê o cookie do carrinho.
export async function CartLink() {
  const { count } = await getCart();
  return (
    <Link
      href="/carrinho"
      className="relative flex size-10 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
    >
      <CartIcon className="size-6" />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-on-primary"
        >
          {count}
        </span>
      )}
      <span className="sr-only">Carrinho ({count === 1 ? "1 item" : `${count} itens`})</span>
    </Link>
  );
}
