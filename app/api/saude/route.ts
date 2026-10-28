import { prisma } from "@/lib/prisma";

// Verificação de saúde para a hospedagem (KAN-53): o site responde e o banco também. Não mostra
// detalhes do erro para quem chama.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
