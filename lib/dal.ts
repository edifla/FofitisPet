import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/session";

// Camada de acesso à sessão. Toda checagem de autorização passa por aqui, nunca só pelo proxy.
// Lê cookies: com Cache Components, quem chama precisa estar dentro de um <Suspense>.

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await readSession();
  if (!session?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true, sessionVersion: true },
  });
  // Sessão de um usuário apagado ou emitida antes de uma troca de senha.
  if (!user || user.sessionVersion !== session.sessionVersion) return null;

  return { id: user.id, name: user.name, email: user.email, role: user.role };
});

export async function requireUser(callbackUrl = "/conta"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/entrar?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  return user;
}

// Para quem não é admin, a área administrativa simplesmente não existe (404).
export async function requireAdmin(callbackUrl = "/admin"): Promise<CurrentUser> {
  const user = await requireUser(callbackUrl);
  if (user.role !== "ADMIN") notFound();
  return user;
}

// Aceita só caminhos internos, para o callbackUrl não virar um redirecionamento para outro site.
export function safeCallbackUrl(value: unknown, fallback = "/conta"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  return value;
}
