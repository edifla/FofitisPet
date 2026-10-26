import type { Metadata } from "next";
import { Suspense } from "react";
import { DeleteButton } from "@/components/admin/delete-button";
import { listBrands } from "@/lib/admin/catalog";
import { deleteBrand } from "../actions";
import { BrandForm } from "./brand-form";

export const metadata: Metadata = { title: "Marcas" };

export default function BrandsPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Marcas</h1>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <BrandList />
      </Suspense>
    </>
  );
}

async function BrandList() {
  const brands = await listBrands();
  return (
    <div className="flex flex-col gap-8">
      <BrandForm />
      {brands.length === 0 ? (
        <p className="text-zinc-500">Nenhuma marca cadastrada ainda.</p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {brands.map((brand) => (
            <li key={brand.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                <span className="font-medium">{brand.name}</span>{" "}
                <span className="text-zinc-500">
                  /{brand.slug} · {brand._count.products} produto(s)
                </span>
              </span>
              <DeleteButton
                action={deleteBrand.bind(null, brand.id)}
                confirmMessage={`Excluir a marca "${brand.name}"? Os produtos dela ficam sem marca.`}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
