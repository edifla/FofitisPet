import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProductVariant } from "@/lib/admin/catalog";
import { centsToInput, gramsToInput } from "@/lib/money";
import { VariantForm } from "../../variant-form";

export const metadata: Metadata = { title: "Editar variação" };

type Props = PageProps<"/admin/produtos/[id]/variacoes/[variantId]">;

export default function EditVariantPage({ params }: Props) {
  return (
    <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
      <EditVariant params={params} />
    </Suspense>
  );
}

async function EditVariant({ params }: Pick<Props, "params">) {
  const { id, variantId } = await params;
  const variant = await getProductVariant(variantId);
  if (!variant || variant.productId !== id) notFound();
  const attributes = (variant.attributes ?? {}) as Record<string, string>;

  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold">Editar variação</h1>
      <p className="mb-6 text-zinc-500">{variant.product.name}</p>
      <VariantForm
        productId={id}
        variant={{
          id: variant.id,
          name: variant.name,
          sku: variant.sku,
          price: centsToInput(variant.priceCents),
          weight: gramsToInput(variant.weightGrams),
          size: attributes.tamanho ?? "",
          flavor: attributes.sabor ?? "",
          active: variant.active,
        }}
      />
    </>
  );
}
