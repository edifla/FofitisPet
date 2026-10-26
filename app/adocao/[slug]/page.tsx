import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { formatAge, getAnimalBySlug, getFoodReceivedGrams } from "@/lib/adoption";
import { formatFoodTotal } from "@/lib/food";
import {
  animalSexLabels,
  animalSizeLabels,
  animalSpeciesLabels,
  temperamentLabels,
} from "@/lib/labels";

type Props = PageProps<"/adocao/[slug]">;

// Datas sem hora vêm do banco à meia-noite UTC.
const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" });
const monthYear = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const animal = await getAnimalBySlug((await params).slug);
  if (!animal) return { title: "Animal não encontrado" };
  return {
    title: `${animal.name} para adoção`,
    description: animal.story.slice(0, 160),
    openGraph: animal.images[0] ? { images: [animal.images[0].url] } : undefined,
  };
}

// Perfil do animal para adoção (KAN-38).
export default function AnimalPage({ params }: Props) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <AnimalProfile params={params} />
      </Suspense>
    </main>
  );
}

async function AnimalProfile({ params }: Pick<Props, "params">) {
  const animal = await getAnimalBySlug((await params).slug);
  if (!animal) notFound();
  const foodGrams = await getFoodReceivedGrams(animal.id);

  const pronoun = animal.sex === "FEMALE" ? "ela" : "ele";
  const a = animal.sex === "FEMALE" ? "a" : "o";
  const health = [
    animal.neutered ? `Castrad${a}` : `Ainda não castrad${a}`,
    animal.dewormed ? `Vermifugad${a}` : "Vermifugação pendente",
  ];

  return (
    <article className="flex flex-col gap-8">
      <nav aria-label="Você está em" className="text-sm text-zinc-500">
        <Link href="/adocao" className="underline">
          Adoção
        </Link>
        {" / "}
        {animal.name}
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery images={animal.images} name={animal.name} />

        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-semibold">{animal.name}</h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              {animalSpeciesLabels[animal.species]} · {animalSexLabels[animal.sex]} ·{" "}
              {animalSizeLabels[animal.size]} · {formatAge(animal.birthDate)}
            </p>
            {animal.arrivedAt && (
              <p className="mt-1 text-sm text-zinc-500">
                No abrigo desde {monthYear.format(animal.arrivedAt)}
              </p>
            )}
          </div>

          {/* Selo de ração recebida (KAN-45). */}
          {(foodGrams > 0 || animal.status !== "ADOPTED") && (
            <div className="flex flex-col gap-1 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
              {foodGrams > 0 ? (
                <p>
                  <strong>{formatFoodTotal(foodGrams)} de ração</strong> já alimentaram{" "}
                  {animal.name} no abrigo, graças às doações.
                </p>
              ) : (
                <p>Toda a ração do abrigo vem de doações feitas na loja.</p>
              )}
              {animal.status !== "ADOPTED" && (
                <Link href="/abrigo" className="underline">
                  Doar ração para o abrigo
                </Link>
              )}
            </div>
          )}

          {animal.temperament.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Temperamento">
              {animal.temperament.map((t) => (
                <li key={t} className="rounded-full bg-zinc-100 px-3 py-1 text-sm dark:bg-zinc-800">
                  {temperamentLabels[t]}
                </li>
              ))}
            </ul>
          )}

          {animal.status === "AVAILABLE" && (
            <div className="flex flex-col gap-2">
              <Link
                href={`/adocao/${animal.slug}/quero-adotar`}
                className="rounded-md bg-zinc-900 px-4 py-3 text-center font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Quero adotar
              </Link>
              <p className="text-sm text-zinc-500">
                Você preenche um formulário rápido e a equipe do abrigo entra em contato.
              </p>
            </div>
          )}
          {animal.status === "RESERVED" && (
            <p className="rounded-md bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              {animal.name} já tem uma adoção em andamento. Conheça os{" "}
              <Link href="/adocao" className="underline">
                outros animais
              </Link>{" "}
              que esperam por uma família.
            </p>
          )}
          {animal.status === "ADOPTED" && (
            <p className="rounded-md bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
              {animal.name} já encontrou uma família! Conheça os{" "}
              <Link href="/adocao" className="underline">
                outros animais
              </Link>{" "}
              do abrigo.
            </p>
          )}
        </div>
      </div>

      <section className="max-w-3xl">
        <h2 className="mb-2 text-lg font-semibold">História</h2>
        <p className="whitespace-pre-line text-zinc-700 dark:text-zinc-300">{animal.story}</p>
      </section>

      <section className="flex max-w-3xl flex-col gap-3">
        <h2 className="text-lg font-semibold">Saúde</h2>
        <ul className="flex flex-wrap gap-2">
          {health.map((item) => (
            <li
              key={item}
              className="rounded-md border border-zinc-200 px-3 py-1 text-sm dark:border-zinc-800"
            >
              {item}
            </li>
          ))}
        </ul>
        {animal.vaccinations.length > 0 ? (
          <table className="text-left text-sm">
            <caption className="mb-1 text-left font-medium">Vacinas</caption>
            <thead className="text-zinc-500">
              <tr>
                <th className="py-1 pr-4 font-normal">Vacina</th>
                <th className="py-1 pr-4 font-normal">Aplicada em</th>
                <th className="py-1 font-normal">Próxima dose</th>
              </tr>
            </thead>
            <tbody>
              {animal.vaccinations.map((v) => (
                <tr key={v.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="py-1 pr-4">{v.name}</td>
                  <td className="py-1 pr-4">{date.format(v.appliedAt)}</td>
                  <td className="py-1">{v.nextDoseAt ? date.format(v.nextDoseAt) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-zinc-500">Nenhuma vacina registrada ainda.</p>
        )}
        {animal.healthNotes && (
          <div>
            <h3 className="font-medium">Observações de saúde</h3>
            <p className="text-sm whitespace-pre-line text-zinc-700 dark:text-zinc-300">
              {animal.healthNotes}
            </p>
          </div>
        )}
        {animal.specialNeeds && (
          <div>
            <h3 className="font-medium">Cuidados especiais</h3>
            <p className="text-sm whitespace-pre-line text-zinc-700 dark:text-zinc-300">
              {animal.specialNeeds}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              A equipe do abrigo explica tudo o que {pronoun} precisa antes da adoção.
            </p>
          </div>
        )}
      </section>
    </article>
  );
}
