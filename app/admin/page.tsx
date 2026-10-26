import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Administração",
  robots: { index: false },
};

export default function AdminHomePage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Administração</h1>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <AdminWelcome />
      </Suspense>
    </>
  );
}

async function AdminWelcome() {
  const admin = await requireAdmin("/admin");
  return (
    <p className="text-zinc-600 dark:text-zinc-400">
      Olá, {admin.name}. Use o menu ao lado para gerenciar a loja.
    </p>
  );
}
