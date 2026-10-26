import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DeleteButton } from "@/components/admin/delete-button";
import { getAnimal } from "@/lib/admin/animals";
import { deleteAnimal, deleteAnimalImage, deleteVaccination, moveAnimalImage } from "../actions";
import { AnimalForm } from "../animal-form";
import { toDateInput, todayInBrazil } from "../dates";
import { AnimalImageUploadForm, MovePhotoButtons, VaccinationForm } from "./forms";

export const metadata: Metadata = { title: "Editar animal" };

type Props = PageProps<"/admin/animais/[id]">;

const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" });

export default function EditAnimalPage({ params }: Props) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Editar animal</h1>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <EditAnimal params={params} />
      </Suspense>
    </>
  );
}

async function EditAnimal({ params }: Pick<Props, "params">) {
  const { id } = await params;
  const animal = await getAnimal(id);
  if (!animal) notFound();
  const today = todayInBrazil();

  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm">
        <Link href="/admin/animais" className="underline">
          ← Animais
        </Link>
      </p>
      <AnimalForm
        today={today}
        animal={{
          id: animal.id,
          name: animal.name,
          slug: animal.slug,
          species: animal.species,
          size: animal.size,
          sex: animal.sex,
          birthDate: toDateInput(animal.birthDate),
          temperament: animal.temperament,
          story: animal.story,
          healthNotes: animal.healthNotes ?? "",
          specialNeeds: animal.specialNeeds ?? "",
          neutered: animal.neutered,
          dewormed: animal.dewormed,
          status: animal.status,
          arrivedAt: toDateInput(animal.arrivedAt),
        }}
      />

      <section className="flex flex-col gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <div>
          <h2 className="font-medium">Fotos</h2>
          <p className="text-sm text-zinc-500">A primeira foto é a capa do animal na listagem.</p>
        </div>
        {animal.images.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhuma foto ainda.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {animal.images.map((image, index) => (
              <li key={image.id} className="flex flex-col gap-2">
                <div className="relative aspect-square overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
                  <Image
                    src={image.url}
                    alt={image.alt ?? ""}
                    fill
                    sizes="(min-width: 768px) 12rem, 45vw"
                    className="object-cover"
                  />
                  {index === 0 && (
                    <span className="absolute top-1 left-1 rounded bg-zinc-900 px-1.5 text-xs text-white">
                      Capa
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <MovePhotoButtons
                    move={moveAnimalImage.bind(null, image.id)}
                    isFirst={index === 0}
                    isLast={index === animal.images.length - 1}
                  />
                  <DeleteButton
                    action={deleteAnimalImage.bind(null, image.id)}
                    confirmMessage="Excluir esta foto?"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
        <AnimalImageUploadForm animalId={animal.id} />
      </section>

      <section className="flex flex-col gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h2 className="font-medium">Vacinas</h2>
        {animal.vaccinations.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhuma vacina registrada.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
            {animal.vaccinations.map((vaccination) => (
              <li key={vaccination.id} className="flex items-center justify-between gap-4 py-2">
                <span>
                  <span className="font-medium">{vaccination.name}</span> · aplicada em{" "}
                  {date.format(vaccination.appliedAt)}
                  {vaccination.nextDoseAt && (
                    <span className="text-zinc-500">
                      {" "}
                      · próxima dose {date.format(vaccination.nextDoseAt)}
                    </span>
                  )}
                </span>
                <DeleteButton
                  action={deleteVaccination.bind(null, vaccination.id)}
                  confirmMessage={`Excluir o registro da vacina ${vaccination.name}?`}
                />
              </li>
            ))}
          </ul>
        )}
        <VaccinationForm animalId={animal.id} today={today} />
      </section>

      <section className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h2 className="mb-2 font-medium">Excluir animal</h2>
        <p className="mb-3 text-sm text-zinc-500">
          Animais com pedidos de adoção não podem ser excluídos. Para tirar da listagem, mude a
          situação para &quot;Fora da listagem&quot;.
        </p>
        <DeleteButton
          action={deleteAnimal.bind(null, animal.id)}
          confirmMessage={`Excluir ${animal.name}, as fotos e as vacinas?`}
          label="Excluir animal"
        />
      </section>
    </div>
  );
}
