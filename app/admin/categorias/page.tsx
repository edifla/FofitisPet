import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DeleteButton } from "@/components/admin/delete-button";
import { listCategories } from "@/lib/admin/catalog";
import { deleteCategory } from "../actions";

export const metadata: Metadata = { title: "Categorias" };

export default function CategoriesPage() {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categorias</h1>
        <Link
          href="/admin/categorias/nova"
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Nova categoria
        </Link>
      </div>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <CategoryTable />
      </Suspense>
    </>
  );
}

async function CategoryTable() {
  const categories = await listCategories();
  if (categories.length === 0) {
    return <p className="text-zinc-500">Nenhuma categoria cadastrada ainda.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
          <tr>
            <th className="py-2 pr-4 font-medium">Nome</th>
            <th className="py-2 pr-4 font-medium">Categoria pai</th>
            <th className="py-2 pr-4 font-medium">Produtos</th>
            <th className="py-2 pr-4 font-medium">Ordem</th>
            <th className="py-2 font-medium">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id} className="border-b border-zinc-100 dark:border-zinc-900">
              <td className="py-2 pr-4">
                <Link href={`/admin/categorias/${category.id}`} className="font-medium underline">
                  {category.name}
                </Link>
                <span className="block text-zinc-500">/{category.slug}</span>
              </td>
              <td className="py-2 pr-4">{category.parent?.name ?? "—"}</td>
              <td className="py-2 pr-4">{category._count.products}</td>
              <td className="py-2 pr-4">{category.position}</td>
              <td className="py-2">
                <DeleteButton
                  action={deleteCategory.bind(null, category.id)}
                  confirmMessage={`Excluir a categoria "${category.name}"? As subcategorias viram categorias principais.`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
