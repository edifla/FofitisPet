import "server-only";
import { OPEN_REQUEST_STATUSES } from "@/lib/adoption-flow";
import { sendEmail } from "@/lib/email";
import { LEGAL } from "@/lib/legal";
import { cancelUnpaidOrder } from "@/lib/orders";
import { prisma } from "@/lib/prisma";

// Direitos do titular na conta (KAN-126): cópia dos dados e exclusão da conta.

export class AccountError extends Error {}

const REMOVED = "[removido a pedido do titular]";

// Cópia dos dados pessoais da conta, em JSON (acesso e portabilidade, LGPD art. 18).
export async function exportUserData(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      role: true,
      createdAt: true,
      termsAcceptedAt: true,
      termsVersion: true,
      addresses: {
        select: {
          label: true,
          recipientName: true,
          zipCode: true,
          street: true,
          number: true,
          complement: true,
          neighborhood: true,
          city: true,
          state: true,
          createdAt: true,
        },
      },
      orders: {
        orderBy: { createdAt: "asc" },
        select: {
          number: true,
          destination: true,
          status: true,
          anonymous: true,
          subtotalCents: true,
          shippingCents: true,
          totalCents: true,
          shippingRecipientName: true,
          shippingZipCode: true,
          shippingStreet: true,
          shippingNumber: true,
          shippingComplement: true,
          shippingNeighborhood: true,
          shippingCity: true,
          shippingState: true,
          shippingMethod: true,
          createdAt: true,
          paidAt: true,
          deliveredAt: true,
          canceledAt: true,
          items: {
            select: { productName: true, variantName: true, quantity: true, totalCents: true },
          },
          // Do cartão, só o que guardamos: bandeira e 4 últimos dígitos.
          payments: {
            select: {
              method: true,
              status: true,
              amountCents: true,
              cardBrand: true,
              cardLastFour: true,
              installments: true,
              createdAt: true,
              paidAt: true,
            },
          },
        },
      },
    },
  });
  const adoptionRequests = await prisma.adoptionRequest.findMany({
    where: { OR: [{ userId }, { applicantEmail: user.email }] },
    orderBy: { createdAt: "asc" },
    // As anotações internas da equipe ficam de fora; podem ser pedidas pelo contato da política.
    select: {
      animal: { select: { name: true } },
      status: true,
      applicantName: true,
      applicantEmail: true,
      applicantPhone: true,
      applicantCity: true,
      applicantState: true,
      housingType: true,
      ownsHome: true,
      hasYard: true,
      householdAgrees: true,
      hasOtherPets: true,
      otherPetsDescription: true,
      experience: true,
      reason: true,
      interviewAt: true,
      decidedAt: true,
      createdAt: true,
    },
  });
  return {
    exportedAt: new Date().toISOString(),
    controller: { name: LEGAL.companyName, contact: LEGAL.contactEmail },
    account: {
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      termsAcceptedAt: user.termsAcceptedAt,
      termsVersion: user.termsVersion,
    },
    addresses: user.addresses,
    orders: user.orders,
    adoptionRequests,
  };
}

// Exclui a conta: apaga o que não precisa ser guardado e anonimiza o resto. Pedidos ficam (por
// obrigação fiscal), sem nome e endereço; doações passam a anônimas. Solicitações de adoção
// abertas são encerradas; adoções aprovadas ficam com o abrigo, que precisa acompanhar o animal.
export async function deleteAccount(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, deletedAt: true },
  });
  if (!user || user.deletedAt) throw new AccountError("Conta não encontrada.");
  if (user.role === "ADMIN") {
    throw new AccountError(
      "Contas de administrador não podem ser excluídas por aqui. Peça a outro administrador.",
    );
  }

  await prisma.$transaction(async (tx) => {
    const pending = await tx.order.findMany({
      where: { userId, status: "PENDING_PAYMENT" },
      select: { id: true },
    });
    for (const order of pending)
      await cancelUnpaidOrder(tx, order.id, "Conta excluída pelo cliente");

    await tx.order.updateMany({
      where: { userId },
      data: {
        anonymous: true,
        shippingRecipientName: null,
        shippingZipCode: null,
        shippingStreet: null,
        shippingNumber: null,
        shippingComplement: null,
        shippingNeighborhood: null,
      },
    });

    const requests = await tx.adoptionRequest.findMany({
      where: { OR: [{ userId }, { applicantEmail: user.email }], status: { not: "APPROVED" } },
      select: { id: true, status: true },
    });
    for (const request of requests) {
      const open = (OPEN_REQUEST_STATUSES as readonly string[]).includes(request.status);
      await tx.adoptionRequest.update({
        where: { id: request.id },
        data: {
          ...(open && { status: "WITHDRAWN", decidedAt: new Date() }),
          userId: null,
          applicantName: REMOVED,
          applicantEmail: `removido-${request.id}@fofitispet.invalid`,
          applicantPhone: "",
          otherPetsDescription: null,
          experience: REMOVED,
          reason: REMOVED,
          adminNotes: null,
          ...(open && {
            events: {
              create: {
                fromStatus: request.status,
                toStatus: "WITHDRAWN",
                note: "Conta excluída pelo interessado.",
              },
            },
          }),
        },
      });
    }

    await tx.address.deleteMany({ where: { userId } });
    await tx.cart.deleteMany({ where: { userId } });
    await tx.passwordResetToken.deleteMany({ where: { userId } });
    await tx.user.update({
      where: { id: userId },
      data: {
        name: "Conta excluída",
        email: `excluida-${userId}@fofitispet.invalid`,
        passwordHash: null,
        phone: null,
        emailVerified: null,
        // Derruba as sessões abertas em outros aparelhos.
        sessionVersion: { increment: 1 },
        deletedAt: new Date(),
      },
    });
  });

  await sendEmail({
    to: user.email,
    subject: "Sua conta na FofitisPet foi excluída",
    text: [
      `Olá, ${user.name}.`,
      "",
      "Sua conta foi excluída como você pediu. Apagamos seus endereços e dados de acesso e",
      "tiramos seu nome dos pedidos e doações, que guardamos só pelo prazo exigido pela",
      "legislação fiscal.",
      "",
      `Dúvidas: ${LEGAL.contactEmail}`,
      "FofitisPet",
    ].join("\n"),
  });
}
