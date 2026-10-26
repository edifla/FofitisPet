import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { DeleteButton } from "@/components/admin/delete-button";
import { todayInBrazil } from "@/lib/campaigns";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { deleteTransparencyPhoto } from "./actions";
import { PhotoUploadForm } from "./photo-form";

export const metadata: Metadata = { title: "Transparência" };

// Datas sem hora vêm do banco à meia-noite UTC.
const day = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" });

// Fotos da página de transparência (KAN-44). Os números da página são calculados sozinhos.
export default function TransparencyAdminPage() {
  return (
    <>
      <h1 className="mb-2 text-2xl font-semibold">Transparência</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Os números de{" "}
        <Link href="/transparencia" className="underline">
          /transparencia
        </Link>{" "}
        vêm das doações e do consumo registrados. Aqui você publica as fotos.
      </p>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <Photos />
      </Suspense>
    </>
  );
}

async function Photos() {
  await requireAdmin();
  const photos = await prisma.transparencyPhoto.findMany({
    orderBy: [{ takenOn: "desc" }, { createdAt: "desc" }],
  });
  return (
    <div className="flex flex-col gap-8">
      <PhotoUploadForm today={todayInBrazil()} />
      {photos.length === 0 ? (
        <p className="text-zinc-500">Nenhuma foto publicada ainda.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {photos.map((photo) => (
            <li key={photo.id} className="flex flex-col gap-1 text-sm">
              <div className="relative aspect-square overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-900">
                <Image
                  src={photo.url}
                  alt={photo.caption}
                  fill
                  sizes="12rem"
                  className="object-cover"
                />
              </div>
              <span>{photo.caption}</span>
              <span className="text-zinc-500">{day.format(photo.takenOn)}</span>
              <DeleteButton
                action={deleteTransparencyPhoto.bind(null, photo.id)}
                confirmMessage="Excluir esta foto da página de transparência?"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
