import Image from "next/image";
import Link from "next/link";
import { Badge, Tag } from "@/components/ui/badge";
import { cardMediaClasses, cardMediaEmptyClasses } from "@/components/ui/card";
import { formatAge, type searchAnimals } from "@/lib/adoption";
import {
  animalSexLabels,
  animalSizeLabels,
  animalSpeciesLabels,
  temperamentLabels,
} from "@/lib/labels";

type AnimalSummary = Awaited<ReturnType<typeof searchAnimals>>["animals"][number];

// Card de animal do design system (KAN-77). O link do nome cobre o card inteiro (after:inset-0).
export function AnimalCard({ animal }: { animal: AnimalSummary }) {
  const cover = animal.images[0];
  return (
    <article className="relative flex flex-col gap-2">
      <div className={cardMediaClasses}>
        {cover ? (
          <Image
            src={cover.url}
            alt={cover.alt ?? animal.name}
            fill
            sizes="(min-width: 1024px) 18rem, (min-width: 640px) 45vw, 90vw"
            className="object-cover"
          />
        ) : (
          <span className={cardMediaEmptyClasses}>Foto em breve</span>
        )}
        {animal.status === "RESERVED" && (
          <Badge tone="warning" position="top-left">
            Reservado
          </Badge>
        )}
      </div>
      <div>
        <h2 className="text-lg font-medium">
          <Link
            href={`/adocao/${animal.slug}`}
            className="after:absolute after:inset-0 hover:underline"
          >
            {animal.name}
          </Link>
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {animalSpeciesLabels[animal.species]} · {animalSexLabels[animal.sex]} ·{" "}
          {animalSizeLabels[animal.size]} · {formatAge(animal.birthDate)}
        </p>
        {animal.temperament.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1" aria-label="Temperamento">
            {animal.temperament.slice(0, 3).map((t) => (
              <li key={t}>
                <Tag>{temperamentLabels[t]}</Tag>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
