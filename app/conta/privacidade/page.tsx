import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccountCard } from "@/components/account/account-card";
import { buttonClasses } from "@/components/ui/button";
import { requireUser } from "@/lib/dal";
import { DeleteAccountForm } from "../delete-account-form";

export const metadata: Metadata = {
  title: "Privacidade",
  robots: { index: false },
};

// Aba "Privacidade": direitos do titular (KAN-126), baixar os dados e excluir a conta.
export default function PrivacyTab() {
  return (
    <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
      <Privacy />
    </Suspense>
  );
}

async function Privacy() {
  const user = await requireUser("/conta/privacidade");
  return (
    <div className="flex flex-col gap-6">
      <AccountCard
        title="Seus dados"
        description={
          <>
            Veja na{" "}
            <Link href="/privacidade" className="underline">
              política de privacidade
            </Link>{" "}
            o que guardamos e por quê.
          </>
        }
      >
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Baixe um arquivo com tudo o que a FofitisPet tem sobre você: cadastro, endereços, pedidos,
          doações e pedidos de adoção.
        </p>
        <div>
          {/* Rota que gera o arquivo: link comum, sem prefetch. */}
          <a
            href="/conta/meus-dados"
            download
            className={buttonClasses({ variant: "secondary", size: "sm" })}
          >
            Baixar meus dados (JSON)
          </a>
        </div>
      </AccountCard>

      <AccountCard title="Excluir minha conta" tone="danger">
        {user.role === "ADMIN" ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Contas de administrador não podem ser excluídas por aqui.
          </p>
        ) : (
          <>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Apagamos seus endereços, carrinho e dados de acesso e encerramos solicitações de
              adoção em aberto. Pedidos e doações ficam guardados pelo prazo da legislação fiscal,
              sem o seu nome e endereço. Pedidos aguardando pagamento são cancelados.
            </p>
            <DeleteAccountForm />
          </>
        )}
      </AccountCard>
    </div>
  );
}
