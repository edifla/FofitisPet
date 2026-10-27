import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cardMediaClasses, cardMediaEmptyClasses } from "@/components/ui/card";
import type { CatalogItem } from "@/lib/catalog";
import { formatBRL } from "@/lib/money";

// Card de produto do design system (KAN-77): o card inteiro é o link.
export function ProductCard({ product }: { product: CatalogItem }) {
  return (
    <Link href={`/produtos/${product.slug}`} className="group flex flex-col gap-2">
      <div className={cardMediaClasses}>
        {product.coverUrl ? (
          <Image
            src={product.coverUrl}
            alt={product.coverAlt ?? product.name}
            fill
            sizes="(min-width: 1024px) 15rem, (min-width: 640px) 30vw, 45vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <span className={cardMediaEmptyClasses}>Sem foto</span>
        )}
        {product.donationEligible && (
          <Badge tone="donate" position="top-right">
            Doável ao abrigo
          </Badge>
        )}
        {!product.inStock && <Badge position="top-left">Esgotado</Badge>}
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
