import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { listProducts } from "@/lib/admin/catalog";

export const metadata: Metadata = { title: "Produtos" };

export default function ProductsPage() {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Produtos</h1>
        <Link
          href="/admin/produtos/novo"
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Novo produto
        </Link>
      </div>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <ProductTable />
      </Suspense>
    </>
  );
}

async function ProductTable() {
  const products = await listProducts();
  if (products.length === 0) {
    return <p className="text-zinc-500">Nenhum produto cadastrado ainda.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
          <tr>
            <th className="py-2 pr-4 font-medium">Produto</th>
            <th className="py-2 pr-4 font-medium">Categoria</th>
            <th className="py-2 pr-4 font-medium">Marca</th>
            <th className="py-2 pr-4 font-medium">Variações</th>
            <th className="py-2 font-medium">Situação</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-zinc-100 dark:border-zinc-900">
              <td className="py-2 pr-4">
                <Link href={`/admin/produtos/${product.id}`} className="font-medium underline">
                  {product.name}
                </Link>
                <span className="block text-zinc-500">/{product.slug}</span>
              </td>
              <td className="py-2 pr-4">{product.category.name}</td>
              <td className="py-2 pr-4">{product.brand?.name ?? "—"}</td>
              <td className="py-2 pr-4">{product._count.variants}</td>
              <td className="py-2">
                {product.active ? "Ativo" : "Inativo"}
                {product.donationEligible && (
                  <span className="block text-zinc-500">Doável ao abrigo</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
