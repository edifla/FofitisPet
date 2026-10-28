import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountCard } from "@/components/account/account-card";
import { Notice } from "@/components/ui/notice";
import { requireUser } from "@/lib/dal";
import { PasswordForm } from "../profile-forms";

export const metadata: Metadata = {
  title: "Senha e segurança",
  robots: { index: false },
};

type Props = PageProps<"/conta/seguranca">;

// Aba "Senha e segurança": trocar a senha. As outras sessões (outros aparelhos) são encerradas.
export default function SecurityPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
      <Security searchParams={searchParams} />
    </Suspense>
  );
}

async function Security({ searchParams }: Pick<Props, "searchParams">) {
  await requireUser("/conta/seguranca");
  const changed = (await searchParams).senha === "alterada";
  return (
    <div className="flex flex-col gap-6">
      {changed && (
        <Notice tone="success" role="status">
          Senha alterada. Você continua conectado aqui; nos outros aparelhos, é preciso entrar de
          novo.
        </Notice>
      )}
      <AccountCard
        title="Trocar a senha"
        description="Ao trocar, você sai da conta em todos os outros aparelhos."
      >
        <PasswordForm />
      </AccountCard>
      <AccountCard title="Dicas de segurança">
        <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
          <li>Use uma senha só para a FofitisPet, que você não usa em outros sites.</li>
          <li>A FofitisPet nunca pede a sua senha por e-mail, WhatsApp ou pelo chat da Lya.</li>
          <li>Esqueceu a senha? Na tela de entrar, use &quot;Esqueci minha senha&quot;.</li>
        </ul>
      </AccountCard>
    </div>
  );
}
