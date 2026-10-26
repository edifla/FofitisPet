import { beforeEach, describe, expect, it } from "vitest";
import { canTransition } from "@/lib/adoption-flow";
import {
  AdoptionFlowError,
  changeRequestStatus,
  createAdoptionRequest,
} from "@/lib/adoption-requests";
import { buildAdoptionTerm, getTermData } from "@/lib/adoption-term";
import { prisma } from "@/lib/prisma";
import { adoptionInterestSchema } from "@/lib/validation/adoption";
import { createAnimal, createUser, resetDatabase } from "./support/factories";

// Fluxo de adoção (KAN-119): interesse, análise, aprovação e termo.

const form = (email: string, overrides: Record<string, string> = {}) =>
  adoptionInterestSchema.parse({
    applicantName: "Ana Souza",
    applicantEmail: email,
    applicantPhone: "(11) 91234-5678",
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
    ...overrides,
  });

async function request(animalId: string, email: string) {
  const result = await createAdoptionRequest(animalId, null, form(email));
  if (!result.ok) throw new Error(result.reason);
  return result.requestId;
}

describe("formulário de interesse", () => {
  beforeEach(resetDatabase);

  it("valida e normaliza os dados", () => {
    const data = form("Ana@Example.COM");
    expect(data).toMatchObject({
      applicantEmail: "ana@example.com",
      applicantPhone: "11912345678",
      ownsHome: true,
      hasOtherPets: false,
    });
    const invalid = adoptionInterestSchema.safeParse({ hasOtherPets: "sim", consent: "" });
    expect(invalid.success).toBe(false);
    const paths = invalid.error!.issues.map((i) => i.path[0]);
    expect(paths).toEqual(
      expect.arrayContaining(["applicantPhone", "consent", "experience", "otherPetsDescription"]),
    );
  });

  it("grava como recebido, com o primeiro evento do histórico", async () => {
    const animal = await createAnimal();
    const id = await request(animal.id, "ana@example.com");
    const saved = await prisma.adoptionRequest.findUniqueOrThrow({
      where: { id },
      include: { events: true },
    });
    expect(saved.status).toBe("RECEIVED");
    expect(saved.events.map((e) => [e.fromStatus, e.toStatus, e.createdById])).toEqual([
      [null, "RECEIVED", null],
    ]);
  });

  it("bloqueia animal indisponível, pedido repetido e excesso de envios", async () => {
    const reserved = await createAnimal("RESERVED");
    expect(await createAdoptionRequest(reserved.id, null, form("a@example.com"))).toEqual({
      ok: false,
      reason: "unavailable",
    });

    const animal = await createAnimal();
    await request(animal.id, "a@example.com");
    expect(await createAdoptionRequest(animal.id, null, form("a@example.com"))).toEqual({
      ok: false,
      reason: "duplicate",
    });

    for (let i = 0; i < 4; i++) await request((await createAnimal()).id, "a@example.com");
    expect(
      await createAdoptionRequest((await createAnimal()).id, null, form("a@example.com")),
    ).toEqual({ ok: false, reason: "too_many" });
  });
});

describe("gestão das solicitações", () => {
  beforeEach(resetDatabase);

  it("segue o fluxo de status e registra cada passo", async () => {
    const admin = await createUser("ADMIN");
    const animal = await createAnimal();
    const id = await request(animal.id, "ana@example.com");
    const change = (to: Parameters<typeof canTransition>[1], interviewAt: Date | null = null) =>
      changeRequestStatus(id, { to, note: null, interviewAt, adminId: admin.id });

    await expect(change("APPROVED")).rejects.toThrow(AdoptionFlowError);
    await change("IN_REVIEW");
    await expect(change("INTERVIEW")).rejects.toThrow(/data e a hora/);
    await change("INTERVIEW", new Date("2026-11-03T17:30:00Z"));
    await change("APPROVED");
    await expect(change("REJECTED")).rejects.toThrow(/não é permitida/);

    const saved = await prisma.adoptionRequest.findUniqueOrThrow({
      where: { id },
      include: { events: { orderBy: { createdAt: "asc" } } },
    });
    expect(saved.status).toBe("APPROVED");
    expect(saved.decidedAt).not.toBeNull();
    expect(saved.interviewAt?.toISOString()).toBe("2026-11-03T17:30:00.000Z");
    expect(saved.events.map((e) => `${e.fromStatus ?? "-"}>${e.toStatus}`)).toEqual([
      "->RECEIVED",
      "RECEIVED>IN_REVIEW",
      "IN_REVIEW>INTERVIEW",
      "INTERVIEW>APPROVED",
    ]);
  });

  it("ao aprovar, o animal é adotado e as outras solicitações abertas são recusadas", async () => {
    const admin = await createUser("ADMIN");
    const animal = await createAnimal();
    const ana = await request(animal.id, "ana@example.com");
    const bruno = await request(animal.id, "bruno@example.com");
    const carla = await request(animal.id, "carla@example.com");
    await changeRequestStatus(carla, {
      to: "WITHDRAWN",
      note: null,
      interviewAt: null,
      adminId: admin.id,
    });
    await changeRequestStatus(ana, {
      to: "IN_REVIEW",
      note: null,
      interviewAt: null,
      adminId: admin.id,
    });
    await changeRequestStatus(ana, {
      to: "APPROVED",
      note: "Visita ok.",
      interviewAt: null,
      adminId: admin.id,
    });

    expect(await prisma.animal.findUniqueOrThrow({ where: { id: animal.id } })).toMatchObject({
      status: "ADOPTED",
      adoptedAt: expect.any(Date),
    });
    const statuses = await prisma.adoptionRequest.findMany({
      where: { animalId: animal.id },
      orderBy: { applicantEmail: "asc" },
      select: { status: true },
    });
    expect(statuses.map((s) => s.status)).toEqual(["APPROVED", "REJECTED", "WITHDRAWN"]);
    const auto = await prisma.adoptionRequestEvent.findFirstOrThrow({
      where: { requestId: bruno, toStatus: "REJECTED" },
    });
    expect(auto).toMatchObject({ createdById: null, note: "Animal adotado por outra família." });

    // Recusada não pode ser reaberta depois que o animal foi adotado.
    await expect(
      changeRequestStatus(bruno, {
        to: "IN_REVIEW",
        note: null,
        interviewAt: null,
        adminId: admin.id,
      }),
    ).rejects.toThrow(/já foi adotado/);
  });

  it("gera o termo em PDF da adoção aprovada", async () => {
    const admin = await createUser("ADMIN");
    const animal = await createAnimal();
    const id = await request(animal.id, "ana@example.com");
    for (const to of ["IN_REVIEW", "APPROVED"] as const) {
      await changeRequestStatus(id, { to, note: null, interviewAt: null, adminId: admin.id });
    }
    const data = await getTermData(id);
    expect(data?.status).toBe("APPROVED");
    const pdf = await buildAdoptionTerm(data!);
    expect(Buffer.from(pdf.subarray(0, 5)).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(1000);
  });
});
