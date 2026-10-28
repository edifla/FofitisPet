import { Suspense } from "react";
import { logout } from "@/app/(auth)/actions";
import { AccountNav, AccountNavLinks } from "@/components/account/account-nav";
import { buttonClasses } from "@/components/ui/button";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const since = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

// Área "Minha conta": cartão com quem está logado, abas ao lado e o conteúdo de cada aba. Cada
// página também confere o usuário: um layout não protege os segmentos filhos.
export default function AccountLayout({ children }: LayoutProps<"/conta">) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 md:px-8">
      <Suspense fallback={<div className="h-24 rounded-3xl bg-zinc-100 dark:bg-zinc-900" />}>
        <AccountHeader />
      </Suspense>
      <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Suspense fallback={<AccountNavLinks pathname={null} />}>
            <AccountNav />
          </Suspense>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}

async function AccountHeader() {
  const session = await requireUser("/conta");
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.id },
    select: { name: true, email: true, createdAt: true },
  });
  return (
    <section
      aria-label="Sua conta"
      className="flex flex-wrap items-center gap-4 rounded-3xl bg-gradient-to-r from-brand-50 to-surface p-5 shadow-sm ring-1 ring-brand-100 sm:p-6 dark:from-brand-950 dark:to-surface dark:ring-brand-900"
    >
      <span
        aria-hidden
        className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xl font-bold text-white dark:bg-brand-400 dark:text-brand-950"
      >
        {user.name.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
          Olá, {user.name.split(" ")[0]}!
        </h1>
        <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">
          {user.email} · cliente desde {since.format(user.createdAt)}
        </p>
      </div>
      <form action={logout}>
        <button type="submit" className={buttonClasses({ variant: "secondary", size: "sm" })}>
          Sair
        </button>
      </form>
    </section>
  );
}
