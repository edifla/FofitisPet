"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/app/generated/prisma/client";
import { signIn } from "@/auth";
import { requireUser } from "@/lib/dal";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { hit, LIMITS, tooManyMessage } from "@/lib/rate-limit";
import {
  emailChangeSchema,
  fieldErrors,
  passwordChangeSchema,
  profileSchema,
  type FormState,
} from "@/lib/validation/account";
import { addressSchema } from "@/lib/validation/address";
import { idArg } from "@/lib/validation/args";

// Área "Minha conta": dados pessoais, e-mail, senha e endereços. Toda ação começa pelo usuário
// logado e só mexe nos registros dele: Server Actions são endpoints públicos.

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "");

// Confere a senha atual (trocar e-mail ou senha), com limite de tentativas por usuário.
async function checkCurrentPassword(userId: string, password: string): Promise<FormState | null> {
  const limit = await hit(`account-password:user:${userId}`, LIMITS.loginByEmail);
  if (!limit.allowed) return { message: tooManyMessage(limit.retryAfterSeconds) };
  const { passwordHash } = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!passwordHash || !(await verifyPassword(password, passwordHash))) {
    return { errors: { currentPassword: ["Senha incorreta."] } };
  }
  return null;
}

export async function updateProfile(_state: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/conta");
  const values = { name: text(formData, "name"), phone: text(formData, "phone") };
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  await prisma.user.update({ where: { id: user.id }, data: parsed.data });
  refresh();
  return { success: true, message: "Dados atualizados." };
}

export async function changeEmail(_state: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/conta");
  const values = { email: text(formData, "email") };
  const parsed = emailChangeSchema.safeParse({
    ...values,
    currentPassword: formData.get("currentPassword"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  if (parsed.data.email === user.email) {
    return { errors: { email: ["Esse já é o seu e-mail."] }, values };
  }

  const denied = await checkCurrentPassword(user.id, parsed.data.currentPassword);
  if (denied) return { ...denied, values };

  try {
    await prisma.user.update({
      where: { id: user.id },
      // O e-mail novo ainda não foi confirmado.
      data: { email: parsed.data.email, emailVerified: null },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      // Mesma mensagem genérica de sempre, para não revelar quem tem conta.
      return { errors: { email: ["Não foi possível usar esse e-mail."] }, values };
    }
    throw error;
  }
  refresh();
  return { success: true, message: "E-mail alterado. Use o novo e-mail para entrar." };
}

export async function changePassword(_state: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/conta/seguranca");
  const parsed = passwordChangeSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const denied = await checkCurrentPassword(user.id, parsed.data.currentPassword);
  if (denied) return denied;

  // A versão da sessão sobe: as outras sessões (outros aparelhos) deixam de valer.
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(parsed.data.password),
      sessionVersion: { increment: 1 },
    },
  });
  // Esta sessão continua: entra de novo com a senha nova.
  await signIn("credentials", {
    email: user.email,
    password: parsed.data.password,
    redirect: false,
  });
  redirect("/conta/seguranca?senha=alterada");
}

function addressValues(formData: FormData) {
  return {
    recipientName: text(formData, "recipientName"),
    zipCode: text(formData, "zipCode"),
    street: text(formData, "street"),
    number: text(formData, "number"),
    complement: text(formData, "complement"),
    neighborhood: text(formData, "neighborhood"),
    city: text(formData, "city"),
    state: text(formData, "state"),
    label: text(formData, "label"),
  };
}

// Cria (addressId nulo) ou edita um endereço do próprio usuário.
export async function saveAddress(
  addressId: string | null,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser("/conta/enderecos");
  const id = addressId === null ? null : idArg(addressId);
  const values = addressValues(formData);
  const parsed = addressSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const makeDefault = formData.get("isDefault") === "on";

  const saved = await prisma.$transaction(async (tx) => {
    if (id) {
      const own = await tx.address.findFirst({ where: { id, userId: user.id } });
      if (!own) return null;
    }
    // O primeiro endereço vira o padrão.
    const isFirst = !id && (await tx.address.count({ where: { userId: user.id } })) === 0;
    const isDefault = makeDefault || isFirst;
    if (isDefault) {
      await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }
    return id
      ? tx.address.update({
          where: { id },
          data: { ...parsed.data, ...(isDefault && { isDefault: true }) },
        })
      : tx.address.create({ data: { ...parsed.data, userId: user.id, isDefault } });
  });
  if (!saved) return { message: "Endereço não encontrado." };
  redirect("/conta/enderecos?salvo=1");
}

export async function setDefaultAddress(addressId: string): Promise<FormState> {
  const user = await requireUser("/conta/enderecos");
  const id = idArg(addressId);
  const own = await prisma.address.findFirst({ where: { id, userId: user.id } });
  if (!own) return { message: "Endereço não encontrado." };
  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    prisma.address.update({ where: { id }, data: { isDefault: true } }),
  ]);
  refresh();
  return { success: true };
}

// Os pedidos guardam uma cópia do endereço, então apagar um endereço salvo não mexe neles.
export async function deleteAddress(addressId: string): Promise<FormState> {
  const user = await requireUser("/conta/enderecos");
  const id = idArg(addressId);
  await prisma.$transaction(async (tx) => {
    const own = await tx.address.findFirst({ where: { id, userId: user.id } });
    if (!own) return;
    await tx.address.delete({ where: { id } });
    // Se era o padrão, o mais recente que sobrou assume.
    if (own.isDefault) {
      const next = await tx.address.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  });
  refresh();
  return { success: true };
}
