import "server-only";
import { prisma } from "@/lib/prisma";

// Endereços do usuário logado. Toda leitura filtra pelo dono.

const addressSelect = {
  id: true,
  label: true,
  recipientName: true,
  zipCode: true,
  street: true,
  number: true,
  complement: true,
  neighborhood: true,
  city: true,
  state: true,
  isDefault: true,
} as const;

export function listAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    select: addressSelect,
  });
}

export function getUserAddress(userId: string, addressId: string) {
  return prisma.address.findFirst({ where: { id: addressId, userId }, select: addressSelect });
}

export type SavedAddress = NonNullable<Awaited<ReturnType<typeof getUserAddress>>>;
