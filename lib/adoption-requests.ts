import "server-only";
import { appUrl, sendEmail } from "@/lib/email";
import { housingTypeLabels } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { type AdoptionInterest, formatPhone } from "@/lib/validation/adoption";

// Solicitações de adoção (KAN-39).

// Solicitações que ainda não tiveram decisão.
export const OPEN_REQUEST_STATUSES = ["RECEIVED", "IN_REVIEW", "INTERVIEW"] as const;

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
