import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Gera um novo link para o usuário e apaga os anteriores que ainda não foram usados.
export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId, usedAt: null } }),
    prisma.passwordResetToken.create({
      data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
    }),
  ]);
  return token;
}

async function findValidToken(token: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) return null;
  return record;
}

export async function isPasswordResetTokenValid(token: string): Promise<boolean> {
  return (await findValidToken(token)) !== null;
}

// Troca a senha, marca o link como usado e incrementa a versão da sessão, o que desconecta
// o usuário de todos os dispositivos. Devolve false se o link for inválido ou já tiver expirado.
export async function resetPasswordWithToken(token: string, password: string): Promise<boolean> {
  const record = await findValidToken(token);
  if (!record) return false;

  const passwordHash = await hashPassword(password);
  return prisma.$transaction(async (tx) => {
    const used = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    // Outra requisição usou o mesmo link ao mesmo tempo.
    if (used.count === 0) return false;

    await tx.user.update({
      where: { id: record.userId },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    });
    return true;
  });
}
