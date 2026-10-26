import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { isPasswordResetTokenValid } from "@/lib/password-reset";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Redefinir senha",
  // O link carrega um token secreto; não deve ser indexado nem enviar o endereço adiante.
  robots: { index: false },
  referrer: "no-referrer",
};

export default function ResetPasswordPage({ params }: PageProps<"/redefinir-senha/[token]">) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Redefinir senha</h1>
      <Suspense fallback={<p className="text-zinc-500">Verificando o link...</p>}>
        <ResetPasswordContent params={params} />
      </Suspense>
    </>
  );
}

async function ResetPasswordContent({
  params,
}: Pick<PageProps<"/redefinir-senha/[token]">, "params">) {
  const { token } = await params;
  if (!(await isPasswordResetTokenValid(token))) {
    return (
      <div className="flex flex-col gap-4">
        <p role="alert" className="text-sm text-red-600">
          Este link é inválido ou já expirou.
        </p>
        <Link href="/esqueci-senha" className="text-sm font-medium underline">
          Pedir um novo link
        </Link>
      </div>
    );
  }
  return <ResetPasswordForm token={token} />;
}
