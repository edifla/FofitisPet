import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { FEW_LEFT, getProductBySlug } from "@/lib/catalog";
import { speciesLabels } from "@/lib/labels";
import { PurchasePanel } from "./purchase-panel";

type Props = PageProps<"/produtos/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Produto não encontrado" };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: product.images[0] ? { images: [product.images[0].url] } : undefined,
  };
}

export default function ProductPage({ params }: Props) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <Suspense fallback={<p className="text-zinc-500">Carregando produto...</p>}>
        <ProductDetails params={params} />
      </Suspense>
    </main>
  );
}

async function ProductDetails({ params }: Pick<Props, "params">) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();
  const { category } = product;

  return (
    <article className="flex flex-col gap-8">
      <nav aria-label="Você está em" className="text-sm text-zinc-500">
        <Link href="/produtos" className="underline">
          Produtos
        </Link>
        {category.parent && (
          <>
            {" / "}
            <Link href={`/produtos?categoria=${category.parent.slug}`} className="underline">
              {category.parent.name}
            </Link>
          </>
        )}
        {" / "}
        <Link href={`/produtos?categoria=${category.slug}`} className="underline">
          {category.name}
        </Link>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <div className="flex flex-col gap-6">
          <div>
            {product.brand && (
              <Link
                href={`/produtos?marca=${product.brand.slug}`}
                className="text-sm text-zinc-500 uppercase hover:underline"
              >
                {product.brand.name}
              </Link>
            )}
            <h1 className="text-2xl font-semibold">{product.name}</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Para {product.species.map((s) => speciesLabels[s].toLowerCase()).join(", ")}
            </p>
          </div>

          <PurchasePanel
            variants={product.variants.map(({ id, name, priceCents, stock }) => ({
              id,
              name,
              priceCents,
              stock,
            }))}
            fewLeft={FEW_LEFT}
          />

          {product.donationEligible && (
            <p className="rounded-md bg-zinc-100 p-3 text-sm dark:bg-zinc-900">
              Este item pode ser comprado para o abrigo da FofitisPet.
            </p>
          )}
        </div>
      </div>

      <section className="max-w-3xl">
        <h2 className="mb-2 text-lg font-semibold">Descrição</h2>
        <p className="whitespace-pre-line text-zinc-700 dark:text-zinc-300">
          {product.description}
        </p>
      </section>
    </article>
  );
}
