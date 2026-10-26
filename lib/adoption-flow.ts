import type { AdoptionRequestStatus } from "@/app/generated/prisma/client";

// Fluxo das solicitações de adoção (KAN-114). Sem dependências de servidor: o admin usa as
// mesmas regras para montar o formulário de mudança de status.

export const adoptionStatusLabels: Record<AdoptionRequestStatus, string> = {
  RECEIVED: "Recebido",
  IN_REVIEW: "Em análise",
  INTERVIEW: "Entrevista",
  APPROVED: "Aprovado",
  REJECTED: "Recusado",
  WITHDRAWN: "Desistência",
};

// Para onde cada status pode ir. Aprovado é final; recusado pode ser reaberto para análise,
// caso tenha sido um engano; desistência é registrada pelo abrigo quando o interessado avisa.
export const ADOPTION_TRANSITIONS: Record<AdoptionRequestStatus, AdoptionRequestStatus[]> = {
  RECEIVED: ["IN_REVIEW", "REJECTED", "WITHDRAWN"],
  IN_REVIEW: ["INTERVIEW", "APPROVED", "REJECTED", "WITHDRAWN"],
  INTERVIEW: ["APPROVED", "REJECTED", "WITHDRAWN"],
  APPROVED: [],
  REJECTED: ["IN_REVIEW"],
  WITHDRAWN: [],
};

export const OPEN_REQUEST_STATUSES = ["RECEIVED", "IN_REVIEW", "INTERVIEW"] as const;

// Status que encerram a solicitação e registram a data da decisão.
export const CLOSED_REQUEST_STATUSES: AdoptionRequestStatus[] = [
  "APPROVED",
  "REJECTED",
  "WITHDRAWN",
];

export function canTransition(from: AdoptionRequestStatus, to: AdoptionRequestStatus) {
  return ADOPTION_TRANSITIONS[from].includes(to);
}

// Slugs usados no filtro da listagem do admin.
export const adoptionStatusSlugs: Record<string, AdoptionRequestStatus> = {
  recebido: "RECEIVED",
  "em-analise": "IN_REVIEW",
  entrevista: "INTERVIEW",
  aprovado: "APPROVED",
  recusado: "REJECTED",
  desistencia: "WITHDRAWN",
};

export const adoptionStatusSlug = (status: AdoptionRequestStatus) =>
  Object.keys(adoptionStatusSlugs).find((slug) => adoptionStatusSlugs[slug] === status)!;
