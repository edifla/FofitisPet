import type { Metadata } from "next";
import { Suspense } from "react";
import { getCatalogOptions } from "@/lib/admin/catalog";
import { CategoryForm } from "../category-form";

export const metadata: Metadata = { title: "Nova categoria" };

export default function NewCategoryPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Nova categoria</h1>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <NewCategoryForm />
      </Suspense>
    </>
  );
}

async function NewCategoryForm() {
  const { categories } = await getCatalogOptions();
  return <CategoryForm parents={categories} />;
}
