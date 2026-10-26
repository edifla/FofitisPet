import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DeleteButton } from "@/components/admin/delete-button";
import { requireAdmin } from "@/lib/dal";
import { getKitForAdmin } from "@/lib/kits";
import { formatBRL } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { deleteKit, removeKitItem } from "../actions";
import { KitForm, KitItemForm } from "../forms";

export const metadata: Metadata = { title: "Editar kit" };

type Props = PageProps<"/admin/kits/[id]">;

export default function EditKitPage({ params }: Props) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Editar kit de doação</h1>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <EditKit params={params} />
      </Suspense>
    </>
  );
}

async function EditKit({ params }: Pick<Props, "params">) {
  await requireAdmin();
  const kit = await getKitForAdmin((await params).id);
  if (!kit) notFound();
  const variants = await prisma.productVariant.findMany({
    where: { active: true, product: { active: true, donationEligible: true } },
    orderBy: [{ product: { name: "asc" } }, { name: "asc" }],
    select: { id: true, name: true, priceCents: true, product: { select: { name: true } } },
  });

  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm">
        <Link href="/admin/kits" className="underline">
          ← Kits de doação
        </Link>
      </p>
      <KitForm
        kit={{
          id: kit.id,
          name: kit.name,
          slug: kit.slug,
          description: kit.description,
          position: String(kit.position),
          active: kit.active,
        }}
      />

      <section className="flex flex-col gap-3">
        <h2 className="font-medium">Itens do kit</h2>
        {kit.items.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nenhum item ainda. O kit só aparece em /doar depois de ter itens.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
            {kit.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 py-2">
                <span>
                  {item.quantity}× {item.variant.product.name} ({item.variant.name}) ·{" "}
                  {formatBRL(item.quantity * item.variant.priceCents)}
                  <span className="text-zinc-500">
                    {" "}
                    · estoque na loja: {item.variant.stockLevels[0]?.quantity ?? 0}
                  </span>
                </span>
                <DeleteButton
                  action={removeKitItem.bind(null, item.id)}
                  confirmMessage={`Tirar ${item.variant.product.name} do kit?`}
                  label="Remover"
                />
              </li>
            ))}
          </ul>
        )}
        <p className="text-sm">
          Total do kit hoje: <strong>{formatBRL(kit.totalCents)}</strong>
          {kit.problems.length > 0 && (
            <span className="text-amber-700 dark:text-amber-400">
              {" "}
              · Indisponível em /doar por causa de: {kit.problems.join(", ")}
            </span>
          )}
        </p>
        <KitItemForm
          kitId={kit.id}
          options={variants.map((v) => ({
            value: v.id,
            label: `${v.product.name} (${v.name}) · ${formatBRL(v.priceCents)}`,
          }))}
        />
      </section>

      <DeleteButton
        action={deleteKit.bind(null, kit.id)}
        confirmMessage={`Excluir o kit "${kit.name}"? Doações já feitas não são afetadas.`}
        label="Excluir kit"
      />
    </div>
  );
}
