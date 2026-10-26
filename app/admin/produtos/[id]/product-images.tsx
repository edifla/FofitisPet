import Image from "next/image";
import { DeleteButton } from "@/components/admin/delete-button";
import { listProductImages } from "@/lib/admin/catalog";
import { deleteProductImage } from "../../actions";
import { ImageUploadForm } from "./image-upload-form";
import { MoveImageButtons } from "./move-image-buttons";

export async function ProductImages({ productId }: { productId: string }) {
  const images = await listProductImages(productId);

  return (
    <section className="flex flex-col gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <div>
        <h2 className="font-medium">Imagens</h2>
        <p className="text-sm text-zinc-500">A primeira imagem é a capa do produto na loja.</p>
      </div>
      {images.length === 0 ? (
        <p className="text-sm text-zinc-500">Nenhuma imagem ainda.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image, index) => (
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
                <MoveImageButtons
                  imageId={image.id}
                  isFirst={index === 0}
                  isLast={index === images.length - 1}
                />
                <DeleteButton
                  action={deleteProductImage.bind(null, image.id)}
                  confirmMessage="Excluir esta imagem?"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      <ImageUploadForm productId={productId} />
    </section>
  );
}
