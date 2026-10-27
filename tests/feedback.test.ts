import { beforeEach, describe, expect, it } from "vitest";
import { createFeedback } from "@/lib/feedback";
import { prisma } from "@/lib/prisma";
import { feedbackSchema, feedbackUpdateSchema } from "@/lib/validation/feedback";
import { createUser, resetDatabase } from "./support/factories";

// Feedback do beta (KAN-52).

describe("feedback do beta", () => {
  beforeEach(resetDatabase);

  it("valida o comentário e limpa o caminho de origem", () => {
    const ok = feedbackSchema.parse({
      kind: "PROBLEM",
      message: "O botão de pagar não respondeu no celular.",
      path: "/pedidos/42?token=x",
      email: "",
    });
    expect(ok).toMatchObject({ path: "/pedidos/42", email: null });
    expect(feedbackSchema.parse({ ...ok, path: "https://outro.site", email: "" }).path).toBeNull();
    const bad = feedbackSchema.safeParse({ kind: "X", message: "curto", path: "", email: "a@" });
    expect(bad.success).toBe(false);
    expect(bad.error!.issues.map((i) => i.path[0])).toEqual(
      expect.arrayContaining(["kind", "message", "email"]),
    );
  });

  it("grava sem login com e-mail opcional, ou ligado à conta", async () => {
    const anon = await createFeedback(
      feedbackSchema.parse({
        kind: "SUGGESTION",
        message: "Seria bom filtrar animais por cidade.",
        path: "/adocao/redefinir/a1B2c3D4e5F6g7H8i9J0k1L2",
        email: "testador@example.com",
      }),
      null,
    );
    const user = await createUser();
    await createFeedback(
      feedbackSchema.parse({
        kind: "PRAISE",
        message: "Gostei muito da página de transparência.",
        path: "/transparencia",
        email: "ignorado@example.com",
      }),
      user,
    );
    const rows = await prisma.feedback.findMany({ orderBy: { createdAt: "asc" } });
    expect(rows[0]).toMatchObject({
      id: anon.id,
      status: "NEW",
      userId: null,
      email: "testador@example.com",
      path: "/adocao/redefinir/:id",
    });
    // Com login, o contato é o da conta: o e-mail digitado não é guardado.
    expect(rows[1]).toMatchObject({ userId: user.id, email: null });
  });

  it("triagem aceita só situações e prioridades conhecidas", () => {
    expect(
      feedbackUpdateSchema.parse({ status: "PLANNED", priority: "HIGH", adminNote: " ok " }),
    ).toEqual({ status: "PLANNED", priority: "HIGH", adminNote: "ok" });
    expect(feedbackUpdateSchema.parse({ status: "NEW", priority: "", adminNote: "" })).toEqual({
      status: "NEW",
      priority: null,
      adminNote: null,
    });
    expect(feedbackUpdateSchema.safeParse({ status: "X", priority: "URGENTE" }).success).toBe(
      false,
    );
  });
});
