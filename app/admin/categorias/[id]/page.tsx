import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCatalogOptions, getCategory } from "@/lib/admin/catalog";
import { CategoryForm } from "../category-form";

export const metadata: Metadata = { title: "Editar categoria" };

export default function EditCategoryPage({ params }: PageProps<"/admin/categorias/[id]">) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Editar categoria</h1>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <EditCategoryForm params={params} />
      </Suspense>
    </>
  );
}

async function EditCategoryForm({ params }: Pick<PageProps<"/admin/categorias/[id]">, "params">) {
  const { id } = await params;
  const [category, { categories }] = await Promise.all([getCategory(id), getCatalogOptions()]);
  if (!category) notFound();
  return <CategoryForm category={category} parents={categories} />;
}
