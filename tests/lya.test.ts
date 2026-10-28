import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/lya/route";
import { detectSensitive, maskSensitive } from "@/lib/lya/guard";
import { resetDatabase } from "./support/factories";

// Lya, a assistente de IA (KAN-127): dados sensíveis, validação, limites e indisponibilidade.
// Nenhum teste chama o modelo de verdade.

function ask(messages: unknown, origin = "http://localhost:3000") {
  return POST(
    new Request("http://localhost:3000/api/lya", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "localhost:3000",
        origin,
        "x-forwarded-for": "203.0.113.7",
      },
      body: JSON.stringify({ messages }),
    }),
  );
}

describe("dados sensíveis", () => {
  it("reconhece cartão (Luhn) e CPF válidos, com ou sem separadores", () => {
    expect(detectSensitive("meu cartão é 4111 1111 1111 1111")).toBe("cartao");
    expect(detectSensitive("5500-0000-0000-0004")).toBe("cartao");
    expect(detectSensitive("cpf 529.982.247-25")).toBe("cpf");
    expect(detectSensitive("52998224725")).toBe("cpf");
  });

  it("não confunde com pedidos, preços, telefones ou números inválidos", () => {
    expect(detectSensitive("pedido 1043, ração de 15 kg por R$ 249,90")).toBeNull();
    expect(detectSensitive("me liga no (11) 98765-4321")).toBeNull();
    expect(detectSensitive("4111 1111 1111 1112")).toBeNull();
    expect(detectSensitive("111.111.111-11")).toBeNull();
  });

  it("esconde só os números sensíveis", () => {
    expect(maskSensitive("cartão 4111 1111 1111 1111, pedido 1043")).toBe(
      "cartão [número removido], pedido 1043",
    );
    expect(maskSensitive("cpf 529.982.247-25")).toBe("cpf [número removido]");
  });
});

describe("rota /api/lya", () => {
  const key = process.env.ANTHROPIC_API_KEY;
  beforeEach(async () => {
    await resetDatabase();
    delete process.env.ANTHROPIC_API_KEY;
  });
  afterEach(() => {
    if (key === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = key;
    vi.restoreAllMocks();
  });

  it("só aceita pedidos do próprio site", async () => {
    const response = await ask([{ role: "user", content: "oi" }], "https://outro-site.example");
    expect(response.status).toBe(403);
  });

  it("valida a conversa", async () => {
    expect((await ask([])).status).toBe(400);
    expect((await ask([{ role: "assistant", content: "oi" }])).status).toBe(400);
    expect((await ask([{ role: "user", content: "x".repeat(2001) }])).status).toBe(400);
  });

  it("responde sobre cartão sem chamar o modelo", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await ask([{ role: "user", content: "pago com 4111111111111111?" }]);
    expect(response.status).toBe(200);
    expect((await response.json()).reply).toMatch(/não leio nem guardo dados de cartão/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sem chave da API, avisa que a Lya está indisponível", async () => {
    const response = await ask([{ role: "user", content: "Quais rações vocês têm?" }]);
    expect(response.status).toBe(503);
    expect((await response.json()).reply).toMatch(/soneca/);
  });

  it("limita as perguntas por IP", async () => {
    for (let i = 0; i < 40; i++) await ask([{ role: "user", content: "oi" }]);
    const response = await ask([{ role: "user", content: "oi" }]);
    expect(response.status).toBe(429);
    expect((await response.json()).reply).toMatch(/Conversamos bastante/);
  });
});
