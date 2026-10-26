import { afterAll, vi } from "vitest";

// Cookies do Next em memória: cada teste pode trocar de "navegador" com resetCookies().
const jar = new Map<string, string>();
export function resetCookies() {
  jar.clear();
}

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (name: string) => void jar.delete(name),
  }),
}));

// Fora de uma requisição do Next, connection() e refresh() não têm o que fazer.
vi.mock("next/server", async (original) => ({
  ...(await original<typeof import("next/server")>()),
  connection: async () => {},
}));
vi.mock("next/cache", () => ({ refresh: () => {}, revalidatePath: () => {} }));

// Os e-mails vão para o log (lib/email.ts); nos testes, silêncio.
vi.spyOn(console, "info").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});

afterAll(async () => {
  const { prisma } = await import("@/lib/prisma");
  await prisma.$disconnect();
});
