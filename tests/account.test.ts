import { beforeEach, describe, expect, it } from "vitest";
import { AccountError, deleteAccount, exportUserData } from "@/lib/account";
import { createAdoptionRequest } from "@/lib/adoption-requests";
import { addItem } from "@/lib/cart";
import { buildCheckoutSummary, placeOrder } from "@/lib/checkout";
import { prisma } from "@/lib/prisma";
import { adoptionInterestSchema } from "@/lib/validation/adoption";
import {
  createAddress,
  createAnimal,
  createUser,
  createVariant,
  resetDatabase,
  stockOf,
} from "./support/factories";

// Direitos do titular (KAN-126): cópia dos dados e exclusão da conta.

const interest = (email: string) =>
  adoptionInterestSchema.parse({
    applicantName: "Ana Souza",
    applicantEmail: email,
    applicantPhone: "11912345678",
    applicantCity: "Campinas",
    applicantState: "SP",
    housingType: "HOUSE",
    ownsHome: "sim",
    hasYard: "sim",
    householdAgrees: "sim",
    hasOtherPets: "nao",
    otherPetsDescription: "",
    experience: "Tive cachorros a vida toda e sei cuidar bem deles.",
    reason: "Tenho casa com quintal e tempo para passear todos os dias.",
    consent: "on",
  });

async function customerWithHistory() {
  const user = await createUser();
  const address = await createAddress(user.id);
  const variant = await createVariant({ stock: 5 });
  await addItem(variant.id, 2);
  const summary = await buildCheckoutSummary(user.id, address.id, "economica");
  if (!summary.ok) throw new Error("resumo inválido");
  const order = await placeOrder(user.id, {
    addressId: address.id,
    shippingId: summary.shipping.id,
    expectedTotalCents: summary.totalCents,
  });
  const animal = await createAnimal();
  const request = await createAdoptionRequest(animal.id, user.id, interest(user.email));
  if (!request.ok) throw new Error(request.reason);
  return { user, address, variant, order, requestId: request.requestId };
}

describe("dados da conta", () => {
  beforeEach(resetDatabase);

  it("exporta conta, endereços, pedidos e solicitações de adoção", async () => {
    const { user } = await customerWithHistory();
    const data = await exportUserData(user.id);
    expect(data.account.email).toBe(user.email);
    expect(data.addresses).toHaveLength(1);
    expect(data.orders).toHaveLength(1);
    expect(data.orders[0].items[0].quantity).toBe(2);
    expect(data.adoptionRequests).toHaveLength(1);
    expect(JSON.stringify(data)).not.toContain("passwordHash");
    expect(JSON.stringify(data)).not.toContain("adminNotes");
  });

  it("exclui a conta: apaga, anonimiza e cancela o que estava pendente", async () => {
    const { user, variant, order, requestId } = await customerWithHistory();
    expect(await stockOf(variant.id, "STORE")).toBe(3);

    await deleteAccount(user.id);

    const deleted = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(deleted).toMatchObject({ name: "Conta excluída", passwordHash: null });
    expect(deleted.email).not.toBe(user.email);
    expect(deleted.deletedAt).not.toBeNull();
    expect(deleted.sessionVersion).toBe(user.sessionVersion + 1);
    expect(await prisma.address.count({ where: { userId: user.id } })).toBe(0);

    // O pedido fica, cancelado (estava aguardando pagamento), sem nome nem endereço.
    const kept = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(kept).toMatchObject({
      status: "CANCELED",
      anonymous: true,
      shippingRecipientName: null,
      shippingStreet: null,
    });
    expect(await stockOf(variant.id, "STORE")).toBe(5);

    const request = await prisma.adoptionRequest.findUniqueOrThrow({
      where: { id: requestId },
      include: { events: true },
    });
    expect(request.status).toBe("WITHDRAWN");
    expect(request.userId).toBeNull();
    expect(request.applicantEmail).not.toBe(user.email);
    expect(request.applicantPhone).toBe("");
    expect(request.events.at(-1)?.note).toBe("Conta excluída pelo interessado.");
  });

  it("não exclui conta de administrador nem a mesma conta duas vezes", async () => {
    const admin = await createUser("ADMIN");
    await expect(deleteAccount(admin.id)).rejects.toThrow(AccountError);
    const user = await createUser();
    await deleteAccount(user.id);
    await expect(deleteAccount(user.id)).rejects.toThrow(AccountError);
  });
});
