import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getCatalogOptions } from "@/lib/admin/catalog";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Novo produto" };

export default function NewProductPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Novo produto</h1>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <NewProductForm />
      </Suspense>
    </>
  );
}

async function NewProductForm() {
  const { categories, brands } = await getCatalogOptions();
  if (categories.length === 0) {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        Cadastre uma{" "}
        <Link href="/admin/categorias/nova" className="underline">
          categoria
        </Link>{" "}
        antes do primeiro produto.
      </p>
    );
  }
  return <ProductForm categories={categories} brands={brands} />;
}
