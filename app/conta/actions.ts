"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { AccountError, deleteAccount } from "@/lib/account";
import { clearCartCookie } from "@/lib/cart";
import { requireUser } from "@/lib/dal";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { hit, LIMITS, tooManyMessage } from "@/lib/rate-limit";
import type { FormState } from "@/lib/validation/form";

// Exclusão da conta a pedido do titular (KAN-126). Pede a senha de novo e uma confirmação.
export async function deleteAccountAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser("/conta");
  if (formData.get("confirm") !== "on") {
    return { errors: { confirm: ["Marque a confirmação para excluir a conta."] } };
  }
  const limit = await hit(`delete-account:user:${user.id}`, LIMITS.loginByEmail);
  if (!limit.allowed) return { message: tooManyMessage(limit.retryAfterSeconds) };

  const { passwordHash } = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  const password = String(formData.get("password") ?? "");
  if (!passwordHash || !password || !(await verifyPassword(password.slice(0, 128), passwordHash))) {
    return { errors: { password: ["Senha incorreta."] } };
  }

  try {
    await deleteAccount(user.id);
  } catch (error) {
    if (error instanceof AccountError) return { message: error.message };
    throw error;
  }
  await clearCartCookie();
  await signOut({ redirect: false });
  redirect("/entrar?conta=excluida");
}
