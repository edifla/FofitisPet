import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getAnimalBySlug } from "@/lib/adoption";
import { getCurrentUser } from "@/lib/dal";
import { InterestForm } from "./interest-form";

type Props = PageProps<"/adocao/[slug]/quero-adotar">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const animal = await getAnimalBySlug((await params).slug);
  return { title: animal ? `Quero adotar ${animal.name}` : "Animal não encontrado" };
}

// Formulário de interesse em adoção (KAN-39).
export default function InterestPage({ params }: Props) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <InterestContent params={params} />
      </Suspense>
    </main>
  );
}

async function InterestContent({ params }: Pick<Props, "params">) {
  const [animal, user] = await Promise.all([
    getAnimalBySlug((await params).slug),
    getCurrentUser(),
  ]);
  if (!animal) notFound();

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Você está em" className="text-sm text-zinc-500">
        <Link href="/adocao" className="underline">
          Adoção
        </Link>
        {" / "}
        <Link href={`/adocao/${animal.slug}`} className="underline">
          {animal.name}
        </Link>
        {" / Quero adotar"}
      </nav>
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Quero adotar {animal.name}</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Conte um pouco sobre você e a sua casa. A equipe do abrigo lê cada formulário e entra em
          contato para conversar. Enviar o formulário não garante a adoção.
        </p>
      </header>
      {animal.status === "AVAILABLE" ? (
        <InterestForm
          animalId={animal.id}
          animalName={animal.name}
          defaults={{ applicantName: user?.name ?? "", applicantEmail: user?.email ?? "" }}
        />
      ) : (
        <p className="rounded-md bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {animal.name} não está mais disponível para adoção. Conheça os{" "}
          <Link href="/adocao" className="underline">
            outros animais
          </Link>{" "}
          do abrigo.
        </p>
      )}
    </div>
  );
}
