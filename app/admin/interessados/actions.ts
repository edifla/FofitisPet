"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { booleanArg, idArg } from "@/lib/validation/args";
import type { FormState } from "@/lib/validation/form";

// Contatos da aba Doar (doação em dinheiro, voluntariado): marcar como contatado e apagar.

export async function setHelpInterestContacted(id: string, contacted: boolean): Promise<FormState> {
  await requireAdmin();
  await prisma.helpInterest.update({
    where: { id: idArg(id) },
    data: { contactedAt: booleanArg(contacted) ? new Date() : null },
  });
  refresh();
  return { success: true };
}

export async function deleteHelpInterest(id: string): Promise<FormState> {
  await requireAdmin();
  await prisma.helpInterest.deleteMany({ where: { id: idArg(id) } });
  refresh();
  return { success: true };
}
