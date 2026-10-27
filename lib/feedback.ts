import "server-only";
import { sanitizePath } from "@/lib/monitoring";
import { prisma } from "@/lib/prisma";
import type { FeedbackInput } from "@/lib/validation/feedback";

// Feedback do beta (KAN-52). Com login, liga à conta e usa o e-mail dela.
export async function createFeedback(input: FeedbackInput, user: { id: string } | null) {
  return prisma.feedback.create({
    data: {
      kind: input.kind,
      message: input.message,
      path: input.path ? sanitizePath(input.path) : null,
      userId: user?.id ?? null,
      email: user ? null : input.email,
    },
    select: { id: true },
  });
}
