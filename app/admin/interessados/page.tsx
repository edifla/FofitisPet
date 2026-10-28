import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DeleteButton } from "@/components/admin/delete-button";
import { cn } from "@/components/ui/cn";
import { table, tableClasses } from "@/components/ui/table";
import type { HelpInterestKind } from "@/app/generated/prisma/client";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { formatPhone } from "@/lib/validation/account";
import { deleteHelpInterest, setHelpInterestContacted } from "./actions";

export const metadata: Metadata = { title: "Interessados" };

type Props = PageProps<"/admin/interessados">;

const KINDS: { slug: string; kind: HelpInterestKind; label: string }[] = [
  { slug: "voluntariado", kind: "VOLUNTEER", label: "Voluntariado" },
  { slug: "dinheiro", kind: "MONEY", label: "Avisar sobre doação em dinheiro" },
];

const date = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

// Quem deixou o contato na aba Doar: voluntários e quem quer ser avisado da doação em dinheiro.
export default function HelpInterestsPage({ searchParams }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Interessados em ajudar</h1>
        <p className="text-sm text-zinc-500">
          Contatos deixados na aba Doar. Os registros são apagados depois de 12 meses.
        </p>
      </div>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <List searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function List({ searchParams }: Pick<Props, "searchParams">) {
  await requireAdmin();
  const tipo = (await searchParams).tipo;
  const current = KINDS.find((k) => k.slug === tipo) ?? KINDS[0];
  const [rows, counts] = await Promise.all([
    prisma.helpInterest.findMany({
      where: { kind: current.kind },
      orderBy: [{ contactedAt: { sort: "asc", nulls: "first" } }, { createdAt: "desc" }],
      take: 200,
    }),
    prisma.helpInterest.groupBy({
      by: ["kind"],
      where: { contactedAt: null },
      _count: { _all: true },
    }),
  ]);
  const pending = (kind: HelpInterestKind) => counts.find((c) => c.kind === kind)?._count._all ?? 0;

  return (
    <>
      <nav aria-label="Tipo de interesse" className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <Link
            key={k.slug}
            href={`/admin/interessados?tipo=${k.slug}`}
            aria-current={k.slug === current.slug ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium ring-1",
              k.slug === current.slug
                ? "bg-primary text-on-primary ring-primary"
                : "bg-surface ring-zinc-200 hover:bg-zinc-100 dark:ring-zinc-700 dark:hover:bg-zinc-800",
            )}
          >
            {k.label} ({pending(k.kind)} para contatar)
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <p className="text-zinc-500">Ninguém por aqui ainda.</p>
      ) : (
        <div className={table.wrap}>
          <table className={table.table}>
            <caption className="sr-only">{current.label}</caption>
            <thead className={table.head}>
              <tr>
                <th className={table.th}>Pessoa</th>
                <th className={table.th}>Mensagem</th>
                <th className={table.th}>Quando</th>
                <th className={tableClasses("th", "text-right")}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={cn(table.row, row.contactedAt && "opacity-60")}>
                  <td className={table.td}>
                    <p className="font-semibold">{row.name}</p>
                    <a href={`mailto:${row.email}`} className="text-brand-text hover:underline">
                      {row.email}
                    </a>
                    {row.phone && <p className="text-zinc-500">{formatPhone(row.phone)}</p>}
                  </td>
                  <td className={tableClasses("td", "max-w-md text-zinc-600 dark:text-zinc-400")}>
                    {row.message ?? "—"}
                  </td>
                  <td
                    className={tableClasses(
                      "td",
                      "whitespace-nowrap text-zinc-600 dark:text-zinc-400",
                    )}
                  >
                    {date.format(row.createdAt)}
                    {row.contactedAt && (
                      <span className="block text-xs">
                        Contatado em {date.format(row.contactedAt)}
                      </span>
                    )}
                  </td>
                  <td className={tableClasses("td", "text-right")}>
                    <div className="flex items-center justify-end gap-2">
                      <DeleteButton
                        tone="neutral"
                        label={row.contactedAt ? "Desmarcar" : "Marcar como contatado"}
                        pendingLabel="Salvando..."
                        action={setHelpInterestContacted.bind(null, row.id, !row.contactedAt)}
                        confirmMessage={
                          row.contactedAt
                            ? `Voltar ${row.name} para a lista de quem falta contatar?`
                            : `Marcar ${row.name} como já contatado?`
                        }
                      />
                      <DeleteButton
                        appearance="button"
                        action={deleteHelpInterest.bind(null, row.id)}
                        confirmMessage={`Apagar o contato de ${row.name}?`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
