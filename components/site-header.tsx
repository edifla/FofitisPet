import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/dal";

// Cabeçalho provisório até o design system (KAN-17). O menu do usuário lê a sessão,
// então fica num <Suspense> para o resto da página não esperar por ele.
export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          FofitisPet
        </Link>
        <Suspense fallback={<span className="h-5 w-24" />}>
          <UserMenu />
        </Suspense>
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
