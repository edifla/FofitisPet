"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { Prisma } from "@/app/generated/prisma/client";
import { signIn, signOut } from "@/auth";
import { safeCallbackUrl } from "@/lib/dal";
import { appUrl, sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { createPasswordResetToken, resetPasswordWithToken } from "@/lib/password-reset";
import {
  fieldErrors,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  type FormState,
} from "@/lib/validation/auth";

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

export async function requestPasswordReset(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = { email: String(formData.get("email") ?? "") };
  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true, email: true },
  });
  if (user) {
    const token = await createPasswordResetToken(user.id);
    await sendEmail({
      to: user.email,
      subject: "Redefinição de senha - FofitisPet",
      text: [
        `Olá, ${user.name}!`,
        "",
        "Recebemos um pedido para redefinir a sua senha. Use o link abaixo em até 1 hora:",
        appUrl(`/redefinir-senha/${token}`),
        "",
        "Se não foi você, ignore este e-mail. Sua senha continua a mesma.",
      ].join("\n"),
    });
  }

  // Mesma resposta exista ou não a conta, para não revelar quais e-mails estão cadastrados.
  return {
    success: true,
    message: "Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha.",
  };
}

export async function resetPassword(_state: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) };
  }

  const ok = await resetPasswordWithToken(parsed.data.token, parsed.data.password);
  if (!ok) {
    return { message: "Este link é inválido ou já expirou. Peça um novo." };
  }
  redirect("/entrar?senha=redefinida");
}
