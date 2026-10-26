import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/dal";
import { KitForm } from "../forms";

export const metadata: Metadata = { title: "Novo kit" };

export default function NewKitPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Novo kit de doação</h1>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <NewKitForm />
      </Suspense>
    </>
  );
}

async function NewKitForm() {
  await requireAdmin();
  return <KitForm />;
}
