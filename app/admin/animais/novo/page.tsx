import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/dal";
import { AnimalForm } from "../animal-form";
import { todayInBrazil } from "../dates";

export const metadata: Metadata = { title: "Novo animal" };

export default function NewAnimalPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Novo animal</h1>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <NewAnimalForm />
      </Suspense>
    </>
  );
}

async function NewAnimalForm() {
  await requireAdmin();
  return <AnimalForm today={todayInBrazil()} />;
}
