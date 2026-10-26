import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Entrar</h1>
      {/* O formulário lê a URL (callbackUrl), que só existe na hora da requisição. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
