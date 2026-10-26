"use server";

import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { fieldErrors, signupSchema, type FormState } from "@/lib/validation/auth";

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

  // O login automático depois do cadastro entra com o Auth.js (KAN-91).
  return { success: true, message: "Conta criada! Você já pode entrar com seu e-mail e senha." };
}
