"use server";

import { AuthError } from "next-auth";
import { Prisma } from "@/app/generated/prisma/client";
import { signIn, signOut } from "@/auth";
import { safeCallbackUrl } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { fieldErrors, loginSchema, signupSchema, type FormState } from "@/lib/validation/auth";

export async function signup(_state: FormState, formData: FormData): Promise<FormState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
  };
  const parsed = signupSchema.safeParse({
    ...values,
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values };
  }

  const { name, email, password } = parsed.data;
  try {
    await prisma.user.create({
      data: { name, email, passwordHash: await hashPassword(password) },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { email: ["Este e-mail já está cadastrado."] }, values };
    }
    throw error;
  }

  // Já entra na conta recém-criada. Em caso de sucesso o signIn redireciona (lança NEXT_REDIRECT).
  await signIn("credentials", { email, password, redirectTo: "/conta" });
}

export async function login(_state: FormState, formData: FormData): Promise<FormState> {
  const values = { email: String(formData.get("email") ?? "") };
  const parsed = loginSchema.safeParse({ ...values, password: formData.get("password") });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values };
  }

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: safeCallbackUrl(formData.get("callbackUrl")),
    });
  } catch (error) {
    // Mesma mensagem para e-mail inexistente e senha errada, para não revelar quem tem conta.
    if (error instanceof AuthError) {
      return { message: "E-mail ou senha incorretos.", values };
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
