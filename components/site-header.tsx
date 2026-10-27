import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { CartLink } from "@/components/cart-link";
import { HeaderNav, MobileMenu } from "@/components/header-nav";
import { NAV_LINKS } from "@/components/nav-links";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonClasses } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/dal";
import { formatBRL } from "@/lib/money";
import { FREE_SHIPPING_FROM_CENTS } from "@/lib/shipping";

// Cabeçalho do site: faixa de recado, menu fixo no topo com as seções, carrinho e conta. O menu da
// conta lê a sessão, então fica num <Suspense> para o resto da página não esperar por ele.
export function SiteHeader() {
  return (
    <>
      <aside
        aria-label="Recado"
        className="bg-brand-100 px-4 py-1.5 text-center text-xs text-brand-800 sm:text-sm dark:bg-brand-800/30 dark:text-brand-100"
      >
        Frete grátis a partir de {formatBRL(FREE_SHIPPING_FROM_CENTS)} ·{" "}
        <Link href="/abrigo" className="font-medium underline-offset-2 hover:underline">
          cada doação vira cuidado no nosso abrigo
        </Link>
      </aside>
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-background/85 backdrop-blur-md dark:border-zinc-800/80">
        <div className="relative flex h-16 w-full items-center justify-between gap-4 px-4 md:px-8">
          <Link href="/" aria-label="FofitisPet, página inicial" className="shrink-0">
            <Logo />
          </Link>
          <Suspense fallback={<StaticNav />}>
            <HeaderNav />
          </Suspense>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Suspense fallback={<span className="size-10" />}>
              <CartLink />
            </Suspense>
            <Suspense fallback={<span className="h-10 w-24" />}>
              <UserMenu />
            </Suspense>
          </div>
        </div>
      </header>
    </>
  );
}

// Enquanto o menu interativo carrega (e sem JavaScript), os mesmos links sem destaque.
function StaticNav() {
  return (
    <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
      {NAV_LINKS.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium"
        >
          <Icon className="size-[18px]" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

async function UserMenu() {
  const user = await getCurrentUser();
  const account = user
    ? [
        { href: "/conta", label: "Minha conta" },
        { href: "/conta/pedidos", label: "Meus pedidos" },
        ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Administração" }] : []),
      ]
    : [
        { href: "/entrar", label: "Entrar" },
        { href: "/cadastro", label: "Criar conta" },
      ];

  return (
    <>
      <div className="hidden items-center gap-2 md:flex">
        {user ? (
          <>
            {user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="rounded-full px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Admin
              </Link>
            )}
            <Link
              href="/conta"
              className="flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <span
                aria-hidden
                className="flex size-8 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-800 dark:bg-brand-800/40 dark:text-brand-100"
              >
                {user.name.charAt(0).toUpperCase()}
              </span>
              Olá, {user.name.split(" ")[0]}
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/entrar"
              className="rounded-full px-3 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Entrar
            </Link>
            <Link href="/cadastro" className={buttonClasses({ size: "sm" })}>
              Criar conta
            </Link>
          </>
        )}
      </div>
      <Suspense fallback={<span className="size-10 md:hidden" />}>
        <MobileMenu account={account} />
      </Suspense>
    </>
  );
}
