import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { CartLink } from "@/components/cart-link";
import { getCurrentUser } from "@/lib/dal";

// Cabeçalho provisório até o design system (KAN-17). O menu do usuário lê a sessão,
// então fica num <Suspense> para o resto da página não esperar por ele.
export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      {/* Em telas estreitas, os links quebram em mais de uma linha em vez de vazar da tela. */}
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link href="/" aria-label="FofitisPet, página inicial">
            <Logo />
          </Link>
          <Link href="/produtos" className="text-sm hover:text-brand-text">
            Produtos
          </Link>
          <Link href="/adocao" className="text-sm hover:text-brand-text">
            Adoção
          </Link>
          <Link href="/abrigo" className="text-sm hover:text-brand-text">
            Abrigo
          </Link>
          <Link href="/doar" className="text-sm hover:text-brand-text">
            Doar
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Suspense fallback={<span className="text-sm">Carrinho</span>}>
            <CartLink />
          </Suspense>
          <Suspense fallback={<span className="h-5 w-24" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <nav className="flex gap-4 text-sm">
        <Link href="/entrar">Entrar</Link>
        <Link href="/cadastro" className="font-medium">
          Criar conta
        </Link>
      </nav>
    );
  }
  return (
    <nav className="flex gap-4 text-sm">
      {user.role === "ADMIN" && <Link href="/admin">Administração</Link>}
      <Link href="/conta">Olá, {user.name.split(" ")[0]}</Link>
    </nav>
  );
}
