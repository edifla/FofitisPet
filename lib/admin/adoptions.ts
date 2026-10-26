import "server-only";
import type { AdoptionRequestStatus } from "@/app/generated/prisma/client";
import { OPEN_REQUEST_STATUSES } from "@/lib/adoption-flow";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

// Leituras das solicitações de adoção no admin (KAN-115).

export const REQUESTS_PAGE_SIZE = 20;

// Sem status escolhido, mostra as que ainda esperam decisão.
export async function listAdoptionRequests(status: AdoptionRequestStatus | null, page = 1) {
  await requireAdmin();
  const where = { status: status ?? { in: [...OPEN_REQUEST_STATUSES] } };
  const open = !status || (OPEN_REQUEST_STATUSES as readonly string[]).includes(status);
  const [total, requests, counts] = await Promise.all([
    prisma.adoptionRequest.count({ where }),
    prisma.adoptionRequest.findMany({
      where,
      // Abertas: as mais antigas primeiro, para ninguém ficar esquecido. Encerradas: as mais
      // recentes primeiro.
      orderBy: { createdAt: open ? "asc" : "desc" },
      skip: (Math.max(1, page) - 1) * REQUESTS_PAGE_SIZE,
      take: REQUESTS_PAGE_SIZE,
      select: {
        id: true,
        status: true,
        applicantName: true,
        applicantCity: true,
        applicantState: true,
        interviewAt: true,
        createdAt: true,
        animal: { select: { name: true, slug: true } },
      },
    }),
    prisma.adoptionRequest.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const countByStatus = Object.fromEntries(counts.map((c) => [c.status, c._count._all])) as Partial<
    Record<AdoptionRequestStatus, number>
  >;
  return { requests, total, pageCount: Math.ceil(total / REQUESTS_PAGE_SIZE), countByStatus };
}

export async function getAdoptionRequest(requestId: string) {
  await requireAdmin();
  return prisma.adoptionRequest.findUnique({
    where: { id: requestId },
    include: {
      animal: { select: { id: true, name: true, slug: true, status: true } },
      user: { select: { email: true } },
      events: {
        orderBy: { createdAt: "asc" },
        include: { createdBy: { select: { name: true } } },
      },
    },
  });
}
