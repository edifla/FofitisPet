import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DeleteButton } from "@/components/admin/delete-button";
import { listCategories } from "@/lib/admin/catalog";
import { deleteCategory } from "../actions";
import { buttonClasses } from "@/components/ui/button";
import { table, tableClasses } from "@/components/ui/table";

export const metadata: Metadata = { title: "Categorias" };

export default function CategoriesPage() {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categorias</h1>
        <Link href="/admin/categorias/nova" className={buttonClasses({ size: "sm" })}>
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
    <div className={table.wrap}>
      <table className={table.table}>
        <thead className={table.head}>
          <tr>
            <th className={tableClasses("th")}>Nome</th>
            <th className={tableClasses("th")}>Categoria pai</th>
            <th className={tableClasses("th")}>Produtos</th>
            <th className={tableClasses("th")}>Ordem</th>
            <th className={tableClasses("th")}>
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id} className={table.row}>
              <td className={tableClasses("td")}>
                <Link href={`/admin/categorias/${category.id}`} className="font-medium underline">
                  {category.name}
                </Link>
                <span className="block text-zinc-500">/{category.slug}</span>
              </td>
              <td className={tableClasses("td")}>{category.parent?.name ?? "—"}</td>
              <td className={tableClasses("td")}>{category._count.products}</td>
              <td className={tableClasses("td")}>{category.position}</td>
              <td className={tableClasses("td")}>
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
