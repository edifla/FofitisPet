import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { hit, hitAll, pruneRateLimits } from "@/lib/rate-limit";
import { booleanArg, idArg, orderNumberArg } from "@/lib/validation/args";
import { resetDatabase } from "./support/factories";

// Revisão de segurança (KAN-48).

const root = path.resolve(__dirname, "..");

function filesUnder(dir: string, match: (name: string) => boolean): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return filesUnder(full, match);
    return match(name) ? [full] : [];
  });
}

// Corpo de cada função exportada como "export async function nome(...) { ... }".
function exportedFunctions(source: string) {
  const result: { name: string; body: string }[] = [];
  const re = /export async function (\w+)\s*\(/g;
  let match;
  while ((match = re.exec(source))) {
    // Pula os parâmetros (que podem ter chaves em tipos) até o "{" do corpo.
    let i = match.index + match[0].length;
    for (let depth = 1; depth > 0; i++) {
      if (source[i] === "(") depth++;
      if (source[i] === ")") depth--;
    }
    const start = source.indexOf("{", i);
    let end = start;
    for (let depth = 0; end < source.length; end++) {
      if (source[end] === "{") depth++;
      if (source[end] === "}" && --depth === 0) break;
    }
    result.push({ name: match[1], body: source.slice(start, end) });
  }
  return result;
}

const relative = (file: string) => path.relative(root, file).replaceAll("\\", "/");

describe("proteção das rotas administrativas (KAN-123)", () => {
  it("toda Server Action do admin começa exigindo admin", () => {
    const files = filesUnder(path.join(root, "app/admin"), (n) => n === "actions.ts");
    expect(files.length).toBeGreaterThan(5);
    const unprotected = files.flatMap((file) =>
      exportedFunctions(readFileSync(file, "utf8"))
        // A primeira instrução precisa ser a checagem (com ou sem guardar o admin numa variável).
        .filter(
          (fn) => !/^\{\s*(?:\/\/[^\n]*\n\s*)*(?:const \w+ = )?await requireAdmin\(/.test(fn.body),
        )
        .map((fn) => `${relative(file)}: ${fn.name}`),
    );
    expect(unprotected).toEqual([]);
  });

  it("toda leitura de lib/admin exige admin", () => {
    const files = filesUnder(path.join(root, "lib/admin"), (n) => n.endsWith(".ts"));
    const unprotected = files.flatMap((file) =>
      exportedFunctions(readFileSync(file, "utf8"))
        .filter((fn) => !fn.body.includes("await requireAdmin("))
        .map((fn) => `${relative(file)}: ${fn.name}`),
    );
    expect(unprotected).toEqual([]);
  });

  it("toda página e rota do admin confere o usuário (direto ou por lib/admin)", () => {
    const files = filesUnder(path.join(root, "app/admin"), (n) =>
      ["page.tsx", "route.ts"].includes(n),
    );
    const unprotected = files
      .filter((file) => {
        const source = readFileSync(file, "utf8");
        return !/requireAdmin\(|getCurrentUser\(|from "@\/lib\/admin\//.test(source);
      })
      .map(relative);
    expect(unprotected).toEqual([]);
  });

  it("o proxy cobre o admin e as áreas logadas", () => {
    // Lido como texto: o proxy importa o Auth.js, que só carrega dentro do Next.
    const proxy = readFileSync(path.join(root, "proxy.ts"), "utf8");
    const matcher = proxy.match(/matcher: \[([^\]]*)\]/)?.[1] ?? "";
    for (const route of ["/admin/:path*", "/conta/:path*", "/checkout", "/pedidos/:path*"]) {
      expect(matcher).toContain(`"${route}"`);
    }
  });
});

describe("limite de tentativas (KAN-122)", () => {
  beforeEach(resetDatabase);
  const limit = { limit: 3, windowSeconds: 60 };

  it("bloqueia depois do limite e libera quando a janela vence", async () => {
    const results = [];
    for (let i = 0; i < 4; i++) results.push((await hit("teste:a", limit)).allowed);
    expect(results).toEqual([true, true, true, false]);
    // Outra chave tem o próprio contador.
    expect((await hit("teste:b", limit)).allowed).toBe(true);

    await prisma.rateLimit.update({
      where: { key: "teste:a" },
      data: { resetAt: new Date(Date.now() - 1000) },
    });
    expect((await hit("teste:a", limit)).allowed).toBe(true);
    expect((await prisma.rateLimit.findUniqueOrThrow({ where: { key: "teste:a" } })).count).toBe(1);
  });

  it("não deixa passar tentativas simultâneas além do limite", async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, () => hit("teste:paralelo", { limit: 10, windowSeconds: 60 })),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(10);
  });

  it("hitAll bloqueia se qualquer chave passou do limite e diz quanto esperar", async () => {
    for (let i = 0; i < 3; i++) await hit("teste:ip", limit);
    const result = await hitAll([
      ["teste:ip", limit],
      ["teste:email", limit],
    ]);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("a rotina periódica apaga os contadores vencidos", async () => {
    await hit("teste:velho", limit);
    await hit("teste:novo", limit);
    await prisma.rateLimit.update({
      where: { key: "teste:velho" },
      data: { resetAt: new Date(Date.now() - 1000) },
    });
    expect(await pruneRateLimits()).toBe(1);
    expect((await prisma.rateLimit.findMany()).map((r) => r.key)).toEqual(["teste:novo"]);
  });
});

describe("argumentos de Server Actions (KAN-121)", () => {
  it("recusam valores fora do formato, como filtros do Prisma no lugar de ids", () => {
    expect(idArg("cmvps9s7z000bmsuo054fwhh5")).toBe("cmvps9s7z000bmsuo054fwhh5");
    for (const bad of [{ not: "" }, ["a"], "", "a".repeat(65), "x' OR 1=1", 1, null]) {
      expect(() => idArg(bad)).toThrow();
    }
    expect(orderNumberArg(42)).toBe(42);
    for (const bad of [0, -1, 1.5, "42", { gt: 0 }, Number.NaN]) {
      expect(() => orderNumberArg(bad)).toThrow();
    }
    expect(booleanArg(true)).toBe(true);
    expect(() => booleanArg("true")).toThrow();
  });
});
