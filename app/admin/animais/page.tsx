import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { listAnimals } from "@/lib/admin/animals";
import { animalSizeLabels, animalStatusLabels, speciesLabels } from "@/lib/labels";

export const metadata: Metadata = { title: "Animais" };

// Animais do abrigo (KAN-36).
export default function AnimalsPage() {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Animais</h1>
        <Link
          href="/admin/animais/novo"
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Novo animal
        </Link>
      </div>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <AnimalTable />
      </Suspense>
    </>
  );
}

async function AnimalTable() {
  const animals = await listAnimals();
  if (animals.length === 0) {
    return <p className="text-zinc-500">Nenhum animal cadastrado ainda.</p>;
  }
  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {animals.map((animal) => (
        <li key={animal.id} className="flex items-center gap-4 py-3">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-900">
            {animal.images[0] ? (
              <Image
                src={animal.images[0].url}
                alt={animal.images[0].alt ?? animal.name}
                fill
                sizes="3.5rem"
                className="object-cover"
              />
            ) : (
              <span className="flex h-full items-center justify-center text-xs text-zinc-400">
                Sem foto
              </span>
            )}
          </div>
          <div className="flex flex-1 flex-col">
            <Link href={`/admin/animais/${animal.id}`} className="font-medium underline">
              {animal.name}
            </Link>
            <span className="text-sm text-zinc-500">
              {speciesLabels[animal.species]} · {animalSizeLabels[animal.size]} ·{" "}
              {animal._count.images} foto(s) · {animal._count.vaccinations} vacina(s)
            </span>
          </div>
          <span className="text-sm">{animalStatusLabels[animal.status]}</span>
        </li>
      ))}
    </ul>
  );
}
