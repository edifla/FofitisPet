import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Role } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validation/auth";

declare module "next-auth" {
  interface User {
    role: Role;
    sessionVersion: number;
  }
  interface Session {
    user: { id: string; role: Role; sessionVersion: number } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    sessionVersion: number;
  }
}

// Hash calculado uma vez para comparar quando o e-mail não existe, para a resposta levar o mesmo
// tempo nos dois casos e não revelar quais e-mails estão cadastrados.
const dummyHash = hashPassword("senha-inexistente-0");

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/entrar" },
  logger: {
    // Senha errada é um caso esperado e já vira mensagem no formulário; não precisa poluir o log.
    error(error) {
      if (error.name === "CredentialsSignin") return;
      console.error(error);
    },
  },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            passwordHash: true,
            sessionVersion: true,
          },
        });
        const valid = await verifyPassword(
          parsed.data.password,
          user?.passwordHash ?? (await dummyHash),
        );
        if (!user?.passwordHash || !valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.sessionVersion = user.sessionVersion;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.sessionVersion = token.sessionVersion;
      return session;
    },
  },
});
