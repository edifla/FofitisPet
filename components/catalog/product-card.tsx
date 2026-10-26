import Image from "next/image";
import Link from "next/link";
import type { CatalogItem } from "@/lib/catalog";
import { formatBRL } from "@/lib/money";

// Card de produto provisório até o design system (KAN-77).
export function ProductCard({ product }: { product: CatalogItem }) {
  return (
    <Link href={`/produtos/${product.slug}`} className="group flex flex-col gap-2">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
        {product.coverUrl ? (
          <Image
            src={product.coverUrl}
            alt={product.coverAlt ?? product.name}
            fill
            sizes="(min-width: 1024px) 15rem, (min-width: 640px) 30vw, 45vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-sm text-zinc-600 dark:text-zinc-400">
            Sem foto
          </span>
        )}
        {product.donationEligible && (
          <span className="absolute top-2 right-2 rounded bg-emerald-700/90 px-2 py-0.5 text-xs text-white">
            Doável ao abrigo
          </span>
        )}
        {!product.inStock && (
          <span className="absolute top-2 left-2 rounded bg-zinc-900/80 px-2 py-0.5 text-xs text-white">
            Esgotado
          </span>
        )}
      </div>
      <div>
        {product.brand && <p className="text-xs text-zinc-500 uppercase">{product.brand}</p>}
        <h2 className="font-medium group-hover:underline">{product.name}</h2>
        <p className="text-sm">
          <span className="text-zinc-500">a partir de </span>
          <span className="font-semibold">{formatBRL(product.minPriceCents)}</span>
        </p>
      </div>
    </Link>
  );
}
