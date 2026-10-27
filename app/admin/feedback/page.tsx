import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import type { FeedbackStatus } from "@/app/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { cardClasses } from "@/components/ui/card";
import { requireAdmin } from "@/lib/dal";
import { feedbackKindLabels, feedbackPriorityLabels, feedbackStatusLabels } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { TriageForm } from "./triage-form";

export const metadata: Metadata = { title: "Feedback do beta" };

type Props = PageProps<"/admin/feedback">;

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

const tabs: { slug: string; label: string; statuses: FeedbackStatus[] }[] = [
  { slug: "abertos", label: "Abertos", statuses: ["NEW", "PLANNED"] },
  { slug: "novos", label: "Novos", statuses: ["NEW"] },
  { slug: "planejados", label: "Planejados", statuses: ["PLANNED"] },
  { slug: "fechados", label: "Fechados", statuses: ["DONE", "DISCARDED"] },
];

// Feedback do beta fechado (KAN-52): triagem e priorização dos ajustes.
export default function FeedbackAdminPage({ searchParams }: Props) {
  return (
    <>
      <h1 className="mb-2 text-2xl font-semibold">Feedback do beta</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Comentários enviados pelo link &quot;Enviar feedback&quot; do rodapé. Dê prioridade e
        acompanhe o que vira ajuste.
      </p>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <FeedbackList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;

async function FeedbackList({ searchParams }: Pick<Props, "searchParams">) {
  await requireAdmin();
  const slug = (await searchParams).aba;
  const tab = tabs.find((t) => t.slug === slug) ?? tabs[0];
  const [items, counts] = await Promise.all([
    prisma.feedback.findMany({
      where: { status: { in: tab.statuses } },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.feedback.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const count = (statuses: FeedbackStatus[]) =>
    counts.filter((c) => statuses.includes(c.status)).reduce((sum, c) => sum + c._count._all, 0);
  // Mais importantes primeiro; sem prioridade por último; dentro do grupo, os mais novos.
  const sorted = [...items].sort(
    (a, b) =>
      (a.priority ? priorityOrder[a.priority] : 3) - (b.priority ? priorityOrder[b.priority] : 3),
  );

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Filtrar feedback" className="flex flex-wrap gap-2 text-sm">
        {tabs.map((t) => (
          <Link
            key={t.slug}
            href={`/admin/feedback?aba=${t.slug}`}
            aria-current={t === tab ? "page" : undefined}
            className="rounded-full border border-zinc-300 px-3 py-1 aria-[current=page]:bg-primary aria-[current=page]:text-on-primary dark:border-zinc-700"
          >
            {t.label} ({count(t.statuses)})
          </Link>
        ))}
      </nav>
      {sorted.length === 0 ? (
        <p className="text-zinc-500">Nada por aqui.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {sorted.map((item) => (
            <li key={item.id} className={cardClasses()}>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge tone={item.kind === "PROBLEM" ? "warning" : "neutral"}>
                  {feedbackKindLabels[item.kind]}
                </Badge>
                {item.priority && (
                  <span className="font-medium">
                    Prioridade {feedbackPriorityLabels[item.priority].toLowerCase()}
                  </span>
                )}
                <span className="text-zinc-500">
                  {dateTime.format(item.createdAt)} · {feedbackStatusLabels[item.status]}
                  {item.path && ` · ${item.path}`}
                  {" · "}
                  {item.user
                    ? `${item.user.name} <${item.user.email}>`
                    : (item.email ?? "sem contato")}
                </span>
              </div>
              <p className="text-sm whitespace-pre-line">{item.message}</p>
              <TriageForm
                feedbackId={item.id}
                status={item.status}
                priority={item.priority ?? ""}
                adminNote={item.adminNote ?? ""}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
