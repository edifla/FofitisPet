import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/dal";
import { listKitsForAdmin } from "@/lib/kits";
import { formatBRL } from "@/lib/money";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "Kits de doação" };

// Kits de doação (KAN-43).
export default function KitsPage() {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Kits de doação</h1>
        <Link href="/admin/kits/novo" className={buttonClasses({ size: "sm" })}>
          Novo kit
        </Link>
      </div>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <KitTable />
      </Suspense>
    </>
  );
}

async function KitTable() {
  await requireAdmin();
  const kits = await listKitsForAdmin();
  if (kits.length === 0) return <p className="text-zinc-500">Nenhum kit cadastrado ainda.</p>;
  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {kits.map((kit) => (
        <li key={kit.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex flex-1 flex-col">
            <Link href={`/admin/kits/${kit.id}`} className="font-medium underline">
              {kit.name}
            </Link>
            <span className="text-sm text-zinc-500">
              {kit.items.length} item(ns) · {formatBRL(kit.totalCents)}
            </span>
          </div>
          <span className="text-sm">
            {!kit.active ? "Inativo" : kit.available ? "No ar" : "Indisponível"}
          </span>
        </li>
      ))}
    </ul>
  );
}
