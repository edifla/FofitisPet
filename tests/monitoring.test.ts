import { beforeEach, describe, expect, it } from "vitest";
import { POST as clientErrors } from "@/app/api/erros/route";
import { POST as pageViews } from "@/app/api/metricas/route";
import { recordError, recordPageView, sanitizePath } from "@/lib/monitoring";
import { prisma } from "@/lib/prisma";
import { resetDatabase } from "./support/factories";

// Monitoramento interno (KAN-51).

const browser = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0";
const post = (
  handler: (r: Request) => Promise<Response>,
  url: string,
  body: string,
  headers: Record<string, string> = {},
) =>
  handler(
    new Request(`http://localhost${url}`, {
      method: "POST",
      body,
      headers: { "user-agent": browser, "x-forwarded-for": "10.0.0.1", ...headers },
    }),
  );

describe("monitoramento", () => {
  beforeEach(resetDatabase);

  it("mascara tokens e ids longos e tira a query dos caminhos", () => {
    expect(sanitizePath("/redefinir-senha/a1B2c3D4e5F6g7H8i9J0k1L2?x=1")).toBe(
      "/redefinir-senha/:id",
    );
    expect(sanitizePath("/admin/adocoes/cmvpsm4860000wcuow3xkbgjb")).toBe("/admin/adocoes/:id");
    expect(sanitizePath("/produtos/racao-premier?pagina=2")).toBe("/produtos/racao-premier");
  });

  it("agrupa erros iguais e reabre um erro resolvido que voltou", async () => {
    const report = {
      source: "server" as const,
      message: "Falhou",
      routePath: "/produtos/[slug]",
      path: "/produtos/a?token=segredo",
    };
    await recordError(report);
    await recordError(report);
    await recordError({ ...report, message: "Outro erro" });
    const rows = await prisma.errorLog.findMany({ orderBy: { message: "asc" } });
    expect(rows.map((r) => [r.message, r.count])).toEqual([
      ["Falhou", 2],
      ["Outro erro", 1],
    ]);
    expect(rows[0].path).toBe("/produtos/a");

    await prisma.errorLog.updateMany({ data: { resolvedAt: new Date() } });
    await recordError(report);
    const reopened = await prisma.errorLog.findFirstOrThrow({ where: { message: "Falhou" } });
    expect(reopened).toMatchObject({ count: 3, resolvedAt: null });
  });

  it("recebe erros do navegador com validação, sem bots", async () => {
    const ok = await post(
      clientErrors,
      "/api/erros",
      JSON.stringify({ message: "x is undefined", stack: "at y", path: "/carrinho" }),
    );
    expect(ok.status).toBe(204);
    expect(await prisma.errorLog.count({ where: { source: "client" } })).toBe(1);
    expect((await post(clientErrors, "/api/erros", "{")).status).toBe(400);
    expect((await post(clientErrors, "/api/erros", JSON.stringify({ message: "" }))).status).toBe(
      400,
    );
    await post(clientErrors, "/api/erros", JSON.stringify({ message: "bot", path: "/" }), {
      "user-agent": "Googlebot/2.1",
    });
    expect(await prisma.errorLog.count()).toBe(1);
  });

  it("conta visualizações por dia e caminho, sem áreas privadas, bots nem Não rastrear", async () => {
    await post(pageViews, "/api/metricas", "/produtos");
    await post(pageViews, "/api/metricas", "/produtos");
    await post(pageViews, "/api/metricas", "/adocao/mel");
    await post(pageViews, "/api/metricas", "/admin/pedidos");
    await post(pageViews, "/api/metricas", "/conta");
    await post(pageViews, "/api/metricas", "https://outro.site/");
    await post(pageViews, "/api/metricas", "/produtos", {
      "user-agent": "facebookexternalhit/1.1",
    });
    await post(pageViews, "/api/metricas", "/produtos", { dnt: "1" });
    await recordPageView("/redefinir-senha/a1B2c3D4e5F6g7H8i9J0k1L2");

    const rows = await prisma.pageViewDaily.findMany({ orderBy: { path: "asc" } });
    expect(rows.map((r) => [r.path, r.views])).toEqual([
      ["/adocao/mel", 1],
      ["/produtos", 2],
      ["/redefinir-senha/:id", 1],
    ]);
  });
});
