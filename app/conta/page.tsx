import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountCard } from "@/components/account/account-card";
import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { formatPhone } from "@/lib/validation/account";
import { EmailForm, ProfileForm } from "./profile-forms";

export const metadata: Metadata = {
  title: "Minha conta",
  robots: { index: false },
};

// Aba "Meus dados": nome, telefone e e-mail de acesso.
export default function AccountPage() {
  return (
    <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
      <MyData />
    </Suspense>
  );
}

async function MyData() {
  const session = await requireUser("/conta");
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.id },
    select: { name: true, email: true, phone: true },
  });
  return (
    <div className="flex flex-col gap-6">
      <AccountCard
        title="Dados pessoais"
        description="Usados nos pedidos, nas doações e nos pedidos de adoção."
      >
        <ProfileForm name={user.name} phone={user.phone ? formatPhone(user.phone) : ""} />
      </AccountCard>
      <AccountCard
        title="E-mail de acesso"
        description="É com ele que você entra no site e recebe os avisos dos pedidos."
      >
        <EmailForm email={user.email} />
      </AccountCard>
    </div>
  );
}
