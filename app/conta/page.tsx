import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { logout } from "@/app/(auth)/actions";
import { requireUser } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Minha conta",
};

export default function AccountPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Minha conta</h1>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <AccountDetails />
      </Suspense>
    </main>
  );
}

async function AccountDetails() {
  const user = await requireUser("/conta");
  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
        <dt className="text-zinc-500">Nome</dt>
        <dd>{user.name}</dd>
        <dt className="text-zinc-500">E-mail</dt>
        <dd>{user.email}</dd>
      </dl>
      <Link href="/conta/pedidos" className="self-start underline">
        Meus pedidos
      </Link>
      <form action={logout}>
        <button
          type="submit"
          className="rounded-md border border-zinc-300 px-4 py-2 dark:border-zinc-700"
        >
          Sair
        </button>
      </form>
    </div>
  );
}
