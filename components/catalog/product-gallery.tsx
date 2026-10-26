"use client";

import Image from "next/image";
import { useState } from "react";

type GalleryImage = { id: string; url: string; alt: string | null };

// Foto principal com miniaturas. Estilo provisório até o design system (KAN-17).
export function ProductGallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const [selected, setSelected] = useState(0);
  const current = images[selected];

  if (!current) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
        Sem foto
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
        <Image
          src={current.url}
          alt={current.alt ?? name}
          fill
          priority
          sizes="(min-width: 768px) 28rem, 100vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto" aria-label="Fotos do produto">
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setSelected(index)}
                aria-label={`Ver foto ${index + 1} de ${images.length}`}
                aria-current={index === selected}
                className="relative block size-16 overflow-hidden rounded-md border-2 border-transparent aria-[current=true]:border-zinc-900 dark:aria-[current=true]:border-zinc-100"
              >
                <Image src={image.url} alt="" fill sizes="4rem" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
