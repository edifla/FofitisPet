import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { listAdoptionRequests } from "@/lib/admin/adoptions";
import { table, tableClasses } from "@/components/ui/table";
import {
  adoptionStatusLabels,
  adoptionStatusSlug,
  adoptionStatusSlugs,
  OPEN_REQUEST_STATUSES,
} from "@/lib/adoption-flow";

export const metadata: Metadata = { title: "Adoções" };

type Props = PageProps<"/admin/adocoes">;

const date = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Sao_Paulo",
});
const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

// Solicitações de adoção (KAN-115).
export default function AdoptionRequestsPage({ searchParams }: Props) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Solicitações de adoção</h1>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <RequestList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

async function RequestList({ searchParams }: Pick<Props, "searchParams">) {
  const params = await searchParams;
  const status = adoptionStatusSlugs[one(params.status) ?? ""] ?? null;
  const page = Math.max(1, Number.parseInt(one(params.pagina) ?? "1", 10) || 1);
  const { requests, total, pageCount, countByStatus } = await listAdoptionRequests(status, page);
  const openCount = OPEN_REQUEST_STATUSES.reduce((sum, s) => sum + (countByStatus[s] ?? 0), 0);

  const tabs = [
    { href: "/admin/adocoes", label: "Abertas", count: openCount, active: !status },
    ...Object.entries(adoptionStatusSlugs).map(([slug, s]) => ({
      href: `/admin/adocoes?status=${slug}`,
      label: adoptionStatusLabels[s],
      count: countByStatus[s] ?? 0,
      active: status === s,
    })),
  ];
  const pageHref = (n: number) =>
    `/admin/adocoes?${new URLSearchParams({
      ...(status && { status: adoptionStatusSlug(status) }),
      pagina: String(n),
    })}`;

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Filtrar por status" className="flex flex-wrap gap-2 text-sm">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className="rounded-full border border-zinc-300 px-3 py-1 aria-[current=page]:bg-zinc-900 aria-[current=page]:text-white dark:border-zinc-700 dark:aria-[current=page]:bg-zinc-100 dark:aria-[current=page]:text-zinc-900"
          >
            {tab.label} ({tab.count})
          </Link>
        ))}
      </nav>

      {requests.length === 0 ? (
        <p className="text-zinc-500">Nenhuma solicitação aqui.</p>
      ) : (
        <table className={table.table}>
          <thead className={table.head}>
            <tr>
              <th className={tableClasses("th")}>Recebida em</th>
              <th className={tableClasses("th")}>Interessado</th>
              <th className={tableClasses("th")}>Animal</th>
              <th className={tableClasses("th")}>Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id} className={table.row}>
                <td className={tableClasses("td")}>{date.format(request.createdAt)}</td>
                <td className={tableClasses("td")}>
                  <Link href={`/admin/adocoes/${request.id}`} className="font-medium underline">
                    {request.applicantName}
                  </Link>
                  <span className="block text-zinc-500">
                    {request.applicantCity}/{request.applicantState}
                  </span>
                </td>
                <td className={tableClasses("td")}>{request.animal.name}</td>
                <td className={tableClasses("td")}>
                  {adoptionStatusLabels[request.status]}
                  {request.status === "INTERVIEW" && request.interviewAt && (
                    <span className="block text-zinc-500">
                      {dateTime.format(request.interviewAt)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {pageCount > 1 && (
        <nav aria-label="Páginas" className="flex items-center justify-center gap-4 text-sm">
          {page > 1 && <Link href={pageHref(page - 1)}>← Anterior</Link>}
          <span>
            Página {page} de {pageCount} ({total})
          </span>
          {page < pageCount && <Link href={pageHref(page + 1)}>Próxima →</Link>}
        </nav>
      )}
    </div>
  );
}
