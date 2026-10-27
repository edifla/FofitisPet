import Link from "next/link";
import { AnimalPhoto } from "@/components/adoption/animal-photo";
import { article, describeAnimal, type searchAnimals, storyTeaser } from "@/lib/adoption";
import { animalSpeciesLabels, temperamentLabels } from "@/lib/labels";

type AnimalSummary = Awaited<ReturnType<typeof searchAnimals>>["animals"][number];

// Card de animal da área de adoção: foto grande, nome em destaque e um pedaço da história, para
// apresentar alguém e não um produto. O link do nome cobre o card inteiro (after:inset-0).
export function AnimalCard({ animal }: { animal: AnimalSummary }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-adopt-100 transition-shadow hover:shadow-lg dark:bg-zinc-900 dark:ring-adopt-900">
      <AnimalPhoto
        image={animal.images[0]}
        name={animal.name}
        sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 92vw"
        className="aspect-[4/3] rounded-none"
      />
      {animal.status === "RESERVED" && (
        <span className="absolute top-3 left-3 rounded-full bg-amber-700 px-3 py-1 text-xs font-medium text-white">
          Adoção em andamento
        </span>
      )}
      <span className="absolute top-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-adopt-900 dark:bg-zinc-900/90 dark:text-adopt-200">
        {animalSpeciesLabels[animal.species]}
      </span>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h2 className="text-2xl font-extrabold text-adopt-900 dark:text-adopt-100">
          <Link href={`/adocao/${animal.slug}`} className="after:absolute after:inset-0">
            {animal.name}
          </Link>
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{describeAnimal(animal)}</p>
        <p className="text-zinc-700 dark:text-zinc-300">“{storyTeaser(animal.story)}”</p>
        {animal.temperament.length > 0 && (
          <ul className="mt-1 flex flex-wrap gap-1.5" aria-label="Jeito">
            {animal.temperament.slice(0, 3).map((t) => (
              <li
                key={t}
                className="rounded-full bg-adopt-50 px-3 py-1 text-xs font-medium text-adopt-800 dark:bg-adopt-950 dark:text-adopt-200"
              >
                {temperamentLabels[t]}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-auto pt-2 text-sm font-semibold text-brand-text group-hover:underline">
          Conhecer {article(animal.sex)} {animal.name} →
        </p>
      </div>
    </article>
  );
}
