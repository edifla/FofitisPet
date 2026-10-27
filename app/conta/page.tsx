import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { logout } from "@/app/(auth)/actions";
import { requireUser } from "@/lib/dal";
import { DeleteAccountForm } from "./delete-account-form";
import { buttonClasses } from "@/components/ui/button";

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
        <button type="submit" className={buttonClasses({ variant: "secondary" })}>
          Sair
        </button>
      </form>

      {/* Direitos do titular (KAN-126). */}
      <section className="mt-6 flex flex-col gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Seus dados</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Veja na{" "}
          <Link href="/privacidade" className="underline">
            política de privacidade
          </Link>{" "}
          o que guardamos e por quê.
        </p>
        {/* Rota que gera o arquivo: link comum, sem prefetch. */}
        <a href="/conta/meus-dados" className="self-start underline" download>
          Baixar meus dados (JSON)
        </a>
        {user.role === "ADMIN" ? (
          <p className="text-sm text-zinc-500">
            Contas de administrador não podem ser excluídas por aqui.
          </p>
        ) : (
          <details className="flex flex-col gap-3">
            <summary className="cursor-pointer text-sm text-red-700 dark:text-red-400">
              Excluir minha conta
            </summary>
            <p className="my-3 text-sm text-zinc-600 dark:text-zinc-400">
              Apagamos seus endereços, carrinho e dados de acesso e encerramos solicitações de
              adoção em aberto. Pedidos e doações ficam guardados pelo prazo da legislação fiscal,
              sem o seu nome e endereço. Pedidos aguardando pagamento são cancelados.
            </p>
            <DeleteAccountForm />
          </details>
        )}
      </section>
    </div>
  );
}
