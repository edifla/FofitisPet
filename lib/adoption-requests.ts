import "server-only";
import type { AdoptionRequestStatus } from "@/app/generated/prisma/client";
import { CLOSED_REQUEST_STATUSES, canTransition, OPEN_REQUEST_STATUSES } from "@/lib/adoption-flow";
import { appUrl, sendEmail } from "@/lib/email";
import { housingTypeLabels } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { type AdoptionInterest, formatPhone } from "@/lib/validation/adoption";

// Solicitações de adoção: recebimento (KAN-39) e mudanças de status (KAN-40).

// Limite de solicitações por e-mail em 24 horas, contra envios em massa.
const DAILY_LIMIT = 5;

export type CreateRequestResult =
  { ok: true; requestId: string } | { ok: false; reason: "unavailable" | "duplicate" | "too_many" };

export async function createAdoptionRequest(
  animalId: string,
  userId: string | null,
  data: AdoptionInterest,
): Promise<CreateRequestResult> {
  // O e-mail já vem em minúsculas da validação.
  const email = data.applicantEmail;
  const [animal, duplicate, recent] = await Promise.all([
    prisma.animal.findUnique({ where: { id: animalId }, select: { name: true, status: true } }),
    prisma.adoptionRequest.findFirst({
      where: {
        animalId,
        applicantEmail: email,
        status: { in: [...OPEN_REQUEST_STATUSES] },
      },
      select: { id: true },
    }),
    prisma.adoptionRequest.count({
      where: {
        applicantEmail: email,
        createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ]);
  if (!animal || animal.status !== "AVAILABLE") return { ok: false, reason: "unavailable" };
  if (duplicate) return { ok: false, reason: "duplicate" };
  if (recent >= DAILY_LIMIT) return { ok: false, reason: "too_many" };

  const request = await prisma.adoptionRequest.create({
    data: {
      animalId,
      userId,
      applicantName: data.applicantName,
      applicantEmail: email,
      applicantPhone: data.applicantPhone,
      applicantCity: data.applicantCity,
      applicantState: data.applicantState,
      housingType: data.housingType,
      ownsHome: data.ownsHome,
      hasYard: data.hasYard,
      householdAgrees: data.householdAgrees,
      hasOtherPets: data.hasOtherPets,
      otherPetsDescription: data.hasOtherPets ? data.otherPetsDescription : null,
      experience: data.experience,
      reason: data.reason,
      events: { create: { toStatus: "RECEIVED" } },
    },
    select: { id: true },
  });

  await sendRequestEmails(request.id, animal.name, data);
  return { ok: true, requestId: request.id };
}

const yes = (value: boolean) => (value ? "sim" : "não");

async function sendRequestEmails(requestId: string, animalName: string, data: AdoptionInterest) {
  await sendEmail({
    to: data.applicantEmail,
    subject: `Recebemos seu interesse em adotar ${animalName}`,
    text: [
      `Olá, ${data.applicantName}!`,
      "",
      `Recebemos seu formulário de interesse em adotar ${animalName}. A equipe do abrigo vai ler`,
      "com carinho e entrar em contato pelo telefone ou e-mail informados, normalmente em até",
      "5 dias úteis.",
      "",
      "Enviar o formulário não garante a adoção: o abrigo avalia cada pedido e pode marcar uma",
      "conversa antes de decidir.",
      "",
      "Obrigado por escolher adotar!",
      "FofitisPet",
    ].join("\n"),
  });

  // Avisa a equipe do abrigo (os administradores).
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true } });
  const summary = [
    `Nova solicitação de adoção para ${animalName}.`,
    "",
    `Interessado: ${data.applicantName} <${data.applicantEmail}>`,
    `Telefone: ${formatPhone(data.applicantPhone)}`,
    `Cidade: ${data.applicantCity}/${data.applicantState}`,
    `Moradia: ${housingTypeLabels[data.housingType]} (própria: ${yes(data.ownsHome)}, quintal: ${yes(data.hasYard)})`,
    `Todos na casa concordam: ${yes(data.householdAgrees)}`,
    `Outros animais: ${data.hasOtherPets ? data.otherPetsDescription : "não"}`,
    "",
    `Ver no painel: ${appUrl(`/admin/adocoes/${requestId}`)}`,
  ].join("\n");
  await Promise.all(
    admins.map((admin) =>
      sendEmail({
        to: admin.email,
        subject: `Nova solicitação de adoção: ${animalName}`,
        text: summary,
      }),
    ),
  );
}

export class AdoptionFlowError extends Error {}

type StatusChange = {
  to: AdoptionRequestStatus;
  note: string | null;
  interviewAt: Date | null;
  adminId: string;
};

// Muda o status de uma solicitação e registra no histórico (KAN-116). Ao aprovar, o animal
// passa a adotado e as outras solicitações abertas para ele são recusadas automaticamente.
export async function changeRequestStatus(requestId: string, change: StatusChange) {
  const { to, note, interviewAt, adminId } = change;
  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.adoptionRequest.findUnique({
      where: { id: requestId },
      select: { status: true, animalId: true, animal: { select: { status: true } } },
    });
    if (!request) throw new AdoptionFlowError("Solicitação não encontrada.");
    const from = request.status;
    if (!canTransition(from, to)) {
      throw new AdoptionFlowError("Essa mudança de status não é permitida.");
    }
    if ((to === "APPROVED" || from === "REJECTED") && request.animal.status === "ADOPTED") {
      throw new AdoptionFlowError("Este animal já foi adotado.");
    }
    if (to === "INTERVIEW" && !interviewAt) {
      throw new AdoptionFlowError("Informe a data e a hora da entrevista.");
    }

    // Só muda se ninguém mudou antes (dois admins ao mesmo tempo).
    const updated = await tx.adoptionRequest.updateMany({
      where: { id: requestId, status: from },
      data: {
        status: to,
        decidedAt: CLOSED_REQUEST_STATUSES.includes(to) ? new Date() : null,
        ...(to === "INTERVIEW" && { interviewAt }),
      },
    });
    if (updated.count === 0) {
      throw new AdoptionFlowError(
        "A solicitação mudou enquanto você editava. Recarregue a página.",
      );
    }
    await tx.adoptionRequestEvent.create({
      data: { requestId, fromStatus: from, toStatus: to, note, createdById: adminId },
    });

    let closedOthers: string[] = [];
    if (to === "APPROVED") {
      await tx.animal.update({
        where: { id: request.animalId },
        data: { status: "ADOPTED", adoptedAt: new Date() },
      });
      const others = await tx.adoptionRequest.findMany({
        where: {
          animalId: request.animalId,
          id: { not: requestId },
          status: { in: [...OPEN_REQUEST_STATUSES] },
        },
        select: { id: true, status: true },
      });
      closedOthers = others.map((other) => other.id);
      await tx.adoptionRequest.updateMany({
        where: { id: { in: closedOthers } },
        data: { status: "REJECTED", decidedAt: new Date() },
      });
      await tx.adoptionRequestEvent.createMany({
        data: others.map((other) => ({
          requestId: other.id,
          fromStatus: other.status,
          toStatus: "REJECTED" as const,
          note: "Animal adotado por outra família.",
        })),
      });
    }
    return { closedOthers };
  });

  await sendStatusEmail(requestId, to);
  for (const id of result.closedOthers) await sendStatusEmail(id, "REJECTED", true);
}

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

// Avisa o interessado nas mudanças que dependem dele. "Em análise" não gera e-mail.
async function sendStatusEmail(
  requestId: string,
  status: AdoptionRequestStatus,
  adoptedByOther = false,
) {
  const request = await prisma.adoptionRequest.findUnique({
    where: { id: requestId },
    select: {
      applicantName: true,
      applicantEmail: true,
      interviewAt: true,
      animal: { select: { name: true } },
    },
  });
  if (!request) return;
  const name = request.animal.name;
  const messages: Partial<Record<AdoptionRequestStatus, { subject: string; body: string[] }>> = {
    INTERVIEW: {
      subject: `Vamos conversar sobre a adoção de ${name}`,
      body: [
        `Gostamos do seu formulário e queremos marcar uma conversa sobre a adoção de ${name}.`,
        request.interviewAt
          ? `Data sugerida: ${dateTime.format(request.interviewAt)}. Se não puder, responda este e-mail.`
          : "",
      ],
    },
    APPROVED: {
      subject: `Sua adoção de ${name} foi aprovada!`,
      body: [
        `Que alegria: a adoção de ${name} foi aprovada! A equipe do abrigo vai combinar com você`,
        "a data para buscar o animal e assinar o termo de adoção.",
      ],
    },
    REJECTED: {
      subject: `Sobre o seu interesse em adotar ${name}`,
      body: adoptedByOther
        ? [
            `${name} já encontrou uma família. Obrigado pelo carinho!`,
            `Há outros animais esperando por um lar: ${appUrl("/adocao")}`,
          ]
        : [
            `Depois de avaliar com cuidado, não vamos seguir com a adoção de ${name} neste momento.`,
            `Obrigado pelo interesse. Há outros animais esperando por um lar: ${appUrl("/adocao")}`,
          ],
    },
  };
  const message = messages[status];
  if (!message) return;
  await sendEmail({
    to: request.applicantEmail,
    subject: message.subject,
    text: [
      `Olá, ${request.applicantName}!`,
      "",
      ...message.body.filter(Boolean),
      "",
      "FofitisPet",
    ].join("\n"),
  });
}
