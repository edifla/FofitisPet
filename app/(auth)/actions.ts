"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { Prisma } from "@/app/generated/prisma/client";
import { LoginRateLimited, signIn, signOut } from "@/auth";
import { attachCartToUser, clearCartCookie } from "@/lib/cart";
import { safeCallbackUrl } from "@/lib/dal";
import { appUrl, sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { clientIp, hit, LIMITS, tooManyMessage } from "@/lib/rate-limit";
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
  const limit = await hit(`signup:ip:${await clientIp()}`, LIMITS.signupByIp);
  if (!limit.allowed) return { message: tooManyMessage(limit.retryAfterSeconds), values };

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

  // Já entra na conta recém-criada e leva o carrinho de visitante junto.
  await signIn("credentials", { email, password, redirect: false });
  await attachCartToUserByEmail(email);
  redirect("/conta");
}

async function attachCartToUserByEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (user) await attachCartToUser(user.id);
}

export async function login(_state: FormState, formData: FormData): Promise<FormState> {
  const values = { email: String(formData.get("email") ?? "") };
  const parsed = loginSchema.safeParse({ ...values, password: formData.get("password") });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error), values };
  }

  try {
    await signIn("credentials", { ...parsed.data, redirect: false });
  } catch (error) {
    if (error instanceof AuthError && (error as LoginRateLimited).code === "rate_limited") {
      return {
        message: "Muitas tentativas de login. Espere alguns minutos e tente de novo.",
        values,
      };
    }
    // Mesma mensagem para e-mail inexistente e senha errada, para não revelar quem tem conta.
    if (error instanceof AuthError) {
      return { message: "E-mail ou senha incorretos.", values };
    }
    throw error;
  }
  await attachCartToUserByEmail(parsed.data.email);
  redirect(safeCallbackUrl(formData.get("callbackUrl")));
}

export async function logout() {
  await clearCartCookie();
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
  const byIp = await hit(`reset:ip:${await clientIp()}`, LIMITS.passwordResetByIp);
  if (!byIp.allowed) return { message: tooManyMessage(byIp.retryAfterSeconds), values };
  // Por e-mail, o excesso só deixa de mandar o link: a resposta é a mesma, para não revelar
  // quais e-mails têm conta nem servir para lotar a caixa de alguém.
  const byEmail = await hit(`reset:email:${parsed.data.email}`, LIMITS.passwordResetByEmail);

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true, email: true },
  });
  if (user && byEmail.allowed) {
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
