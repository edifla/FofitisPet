import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AnimalPhoto } from "@/components/adoption/animal-photo";
import { article, getAnimalBySlug } from "@/lib/adoption";
import { getCurrentUser } from "@/lib/dal";
import { InterestForm } from "./interest-form";
import { noticeClasses } from "@/components/ui/notice";
import { containerClasses } from "@/components/ui/layout";

type Props = PageProps<"/adocao/[slug]/quero-adotar">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const animal = await getAnimalBySlug((await params).slug);
  return { title: animal ? `Quero adotar ${animal.name}` : "Animal não encontrado" };
}

// Formulário de interesse em adoção (KAN-39).
export default function InterestPage({ params }: Props) {
  return (
    <main className={containerClasses("narrow")}>
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
      <nav aria-label="Você está em" className="text-sm text-adopt-800 dark:text-adopt-300">
        <Link href="/adocao" className="underline">
          Adoção
        </Link>
        {" / "}
        <Link href={`/adocao/${animal.slug}`} className="underline">
          {animal.name}
        </Link>
        {" / Quero adotar"}
      </nav>
      <header className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-adopt-100 to-adopt-50 p-5 dark:from-adopt-950 dark:to-zinc-950">
        <AnimalPhoto
          image={animal.images[0]}
          name={animal.name}
          sizes="5rem"
          compact
          className="aspect-square w-20 shrink-0 rounded-2xl"
        />
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold text-adopt-950 sm:text-3xl dark:text-white">
            Que bom que você quer conhecer {article(animal.sex)} {animal.name}!
          </h1>
          <p className="text-zinc-700 dark:text-zinc-300">
            Conte um pouco sobre você e a sua casa. A equipe do abrigo lê cada formulário com
            carinho e entra em contato para conversar. Enviar o formulário não garante a adoção: é o
            começo de uma conversa.
          </p>
        </div>
      </header>
      {animal.status === "AVAILABLE" ? (
        <InterestForm
          animalId={animal.id}
          animalName={animal.name}
          defaults={{ applicantName: user?.name ?? "", applicantEmail: user?.email ?? "" }}
        />
      ) : (
        <p className={noticeClasses("warning")}>
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
