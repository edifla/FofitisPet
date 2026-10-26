import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DeleteButton } from "@/components/admin/delete-button";
import { getCatalogOptions, getProduct } from "@/lib/admin/catalog";
import { deleteProduct } from "../../actions";
import { ProductForm } from "../product-form";
import { ProductImages } from "./product-images";

export const metadata: Metadata = { title: "Editar produto" };

export default function EditProductPage({ params }: PageProps<"/admin/produtos/[id]">) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Editar produto</h1>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <EditProductForm params={params} />
      </Suspense>
    </>
  );
}

async function EditProductForm({ params }: Pick<PageProps<"/admin/produtos/[id]">, "params">) {
  const { id } = await params;
  const [product, { categories, brands }] = await Promise.all([
    getProduct(id),
    getCatalogOptions(),
  ]);
  if (!product) notFound();
  return (
    <div className="flex flex-col gap-8">
      <ProductForm product={product} categories={categories} brands={brands} />
      <ProductImages productId={product.id} />
      <section className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h2 className="mb-2 font-medium">Excluir produto</h2>
        <p className="mb-3 text-sm text-zinc-500">
          Só é possível excluir produtos que nunca foram vendidos. Para tirar da loja, desmarque
          &quot;Ativo na loja&quot;.
        </p>
        <DeleteButton
          action={deleteProduct.bind(null, product.id)}
          confirmMessage={`Excluir o produto "${product.name}" e as variações dele?`}
          label="Excluir produto"
        />
      </section>
    </div>
  );
}
