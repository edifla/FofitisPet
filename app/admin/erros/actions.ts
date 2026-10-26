"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import type { FormState } from "@/lib/validation/form";

// Marca um erro como resolvido (KAN-51). Se ele voltar a acontecer, reaparece como aberto.
export async function resolveError(errorId: string): Promise<FormState> {
  await requireAdmin();
  await prisma.errorLog.updateMany({ where: { id: errorId }, data: { resolvedAt: new Date() } });
  refresh();
  return { success: true };
}
