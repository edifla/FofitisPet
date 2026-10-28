import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AnimalCard } from "@/components/adoption/animal-card";
import { AnimalPhoto } from "@/components/adoption/animal-photo";
import { HowItWorks } from "@/components/adoption/how-it-works";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { buttonClasses } from "@/components/ui/button";
import { noticeClasses } from "@/components/ui/notice";
import {
  article,
  describeAnimal,
  getAnimalBySlug,
  getFoodReceivedGrams,
  getOtherAnimals,
} from "@/lib/adoption";
import { formatFoodTotal } from "@/lib/food";
import { animalSpeciesLabels, temperamentLabels } from "@/lib/labels";

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

// Perfil do animal (KAN-38), escrito como uma apresentação e não como uma ficha de produto.
export default function AnimalPage({ params }: Props) {
  return (
    <main className="flex flex-1 flex-col">
      <Suspense
        fallback={
          <p className="mx-auto w-full max-w-6xl px-4 py-10 text-zinc-500">Carregando...</p>
        }
      >
        <AnimalProfile params={params} />
      </Suspense>
    </main>
  );
}

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span
        aria-hidden
        className={
          ok
            ? "flex size-6 items-center justify-center rounded-full bg-adopt-700 text-xs text-white dark:bg-adopt-400 dark:text-adopt-950"
            : "flex size-6 items-center justify-center rounded-full border-2 border-adopt-300 text-xs text-adopt-800 dark:text-adopt-200"
        }
      >
        {ok ? "✓" : "…"}
      </span>
      {children}
    </li>
  );
}

async function AnimalProfile({ params }: Pick<Props, "params">) {
  const animal = await getAnimalBySlug((await params).slug);
  if (!animal) notFound();
  const [foodGrams, others] = await Promise.all([
    getFoodReceivedGrams(animal.id),
    getOtherAnimals(animal.id),
  ]);

  const a = article(animal.sex);
  const pronoun = animal.sex === "FEMALE" ? "ela" : "ele";
  const female = animal.sex === "FEMALE";

  return (
    <>
      <section className="bg-gradient-to-b from-adopt-100 to-transparent dark:from-adopt-950">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pt-6 pb-10">
          <nav aria-label="Você está em" className="text-sm text-adopt-800 dark:text-adopt-300">
            <Link href="/adocao" className="underline">
              Adoção
            </Link>
            {" / "}
            {animal.name}
          </nav>

          <div className="grid items-start gap-8 md:grid-cols-2">
            {animal.images.length > 0 ? (
              <div className="overflow-hidden rounded-3xl">
                <ProductGallery images={animal.images} name={animal.name} />
              </div>
            ) : (
              <AnimalPhoto
                name={animal.name}
                sizes="(min-width: 768px) 32rem, 100vw"
                className="aspect-square"
                priority
              />
            )}

            <div className="flex flex-col gap-5">
              <div>
                <p className="text-sm font-semibold tracking-wide text-adopt-800 uppercase dark:text-adopt-300">
                  {animalSpeciesLabels[animal.species]} para adoção
                </p>
                <h1 className="text-4xl font-extrabold text-adopt-950 sm:text-5xl dark:text-white">
                  Oi! Eu sou {a} {animal.name}
                </h1>
                <p className="mt-2 text-lg text-zinc-700 dark:text-zinc-300">
                  {describeAnimal(animal)}
                  {animal.arrivedAt &&
                    `. Estou no abrigo desde ${monthYear.format(animal.arrivedAt)}`}
                  .
                </p>
              </div>

              {animal.temperament.length > 0 && (
                <div>
                  <h2 className="mb-2 font-bold text-adopt-900 dark:text-adopt-100">Meu jeito</h2>
                  <ul className="flex flex-wrap gap-2">
                    {animal.temperament.map((t) => (
                      <li
                        key={t}
                        className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-adopt-800 ring-1 ring-adopt-200 dark:bg-zinc-900 dark:text-adopt-200 dark:ring-adopt-900"
                      >
                        {temperamentLabels[t]}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {animal.status === "AVAILABLE" && (
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/adocao/${animal.slug}/quero-adotar`}
                    className={buttonClasses({ size: "lg", className: "text-lg" })}
                  >
                    Quero conhecer {a} {animal.name}
                  </Link>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    É só um primeiro passo: você conta um pouco sobre você e a equipe do abrigo
                    entra em contato para conversar. Sem compromisso.
                  </p>
                </div>
              )}
              {animal.status === "RESERVED" && (
                <p className={noticeClasses("warning")}>
                  {animal.name} já tem uma adoção em andamento. Que tal conhecer quem também está
                  esperando? Veja logo abaixo.
                </p>
              )}
              {animal.status === "ADOPTED" && (
                <p className={noticeClasses("success")}>
                  {animal.name} já encontrou uma família! Obrigado a todo mundo que torceu por{" "}
                  {pronoun}.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-12 md:grid-cols-[1fr_20rem]">
        <section className="flex flex-col gap-3 rounded-3xl bg-adopt-50 p-6 sm:p-8 dark:bg-adopt-950/40">
          <h2 className="text-2xl font-extrabold text-adopt-950 dark:text-white">Minha história</h2>
          <p className="text-lg leading-relaxed whitespace-pre-line text-zinc-800 dark:text-zinc-200">
            {animal.story}
          </p>
        </section>

        <aside className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-extrabold text-adopt-950 dark:text-white">
              Como estou de saúde
            </h2>
            <ul className="flex flex-col gap-2 text-sm">
              <Check ok={animal.neutered}>
                {animal.neutered
                  ? `Castrad${a}`
                  : `Ainda não castrad${a} (a equipe orienta sobre isso)`}
              </Check>
              <Check ok={animal.dewormed}>
                {animal.dewormed ? `Vermifugad${a}` : "Vermifugação a fazer"}
              </Check>
              <Check ok={animal.vaccinations.length > 0}>
                {animal.vaccinations.length > 0
                  ? `Vacinas: ${animal.vaccinations
                      .map((v) => `${v.name} (${date.format(v.appliedAt)})`)
                      .join(", ")}`
                  : "Vacinas ainda não registradas"}
              </Check>
            </ul>
            {animal.vaccinations.some((v) => v.nextDoseAt) && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Próxima dose:{" "}
                {animal.vaccinations
                  .filter((v) => v.nextDoseAt)
                  .map((v) => `${v.name} em ${date.format(v.nextDoseAt!)}`)
                  .join(", ")}
                .
              </p>
            )}
            {animal.healthNotes && (
              <p className="text-sm whitespace-pre-line text-zinc-700 dark:text-zinc-300">
                {animal.healthNotes}
              </p>
            )}
            {animal.specialNeeds && (
              <div className="rounded-2xl border border-adopt-200 p-4 text-sm dark:border-adopt-900">
                <h3 className="font-bold">Cuidados especiais</h3>
                <p className="whitespace-pre-line text-zinc-700 dark:text-zinc-300">
                  {animal.specialNeeds}
                </p>
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                  A equipe do abrigo explica tudo o que {pronoun} precisa antes da adoção.
                </p>
              </div>
            )}
          </section>

          {/* Selo de ração recebida (KAN-45). */}
          {(foodGrams > 0 || animal.status !== "ADOPTED") && (
            <section className="flex flex-col gap-1 rounded-2xl bg-donate-50 p-4 text-sm text-donate-900 dark:bg-donate-950 dark:text-donate-100">
              {foodGrams > 0 ? (
                <p>
                  <strong>{formatFoodTotal(foodGrams)} de ração</strong> já alimentaram {a}{" "}
                  {animal.name} no abrigo, graças às doações.
                </p>
              ) : (
                <p>Toda a ração do abrigo vem de doações feitas na loja.</p>
              )}
              {animal.status !== "ADOPTED" && (
                <Link href="/compre-para-o-abrigo" className="font-medium underline">
                  Doar ração para o abrigo
                </Link>
              )}
            </section>
          )}
        </aside>
      </div>

      {animal.status === "AVAILABLE" && (
        <section className="border-y border-adopt-100 bg-adopt-50 dark:border-adopt-900 dark:bg-adopt-950/40">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-10">
            <h2 className="text-2xl font-extrabold text-adopt-950 dark:text-white">
              Como funciona a adoção
            </h2>
            <HowItWorks />
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-12">
          <h2 className="text-2xl font-extrabold text-adopt-950 dark:text-white">
            {female ? "Amigos dela" : "Amigos dele"} que também esperam por uma família
          </h2>
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((other) => (
              <li key={other.id}>
                <AnimalCard animal={other} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
