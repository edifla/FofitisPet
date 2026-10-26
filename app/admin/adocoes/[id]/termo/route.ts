import { buildAdoptionTerm, getTermData } from "@/lib/adoption-term";
import { getCurrentUser } from "@/lib/dal";

// Download do termo de adoção em PDF (KAN-41). Só para administradores e adoções aprovadas.
export async function GET(
  _request: Request,
  { params }: RouteContext<"/admin/adocoes/[id]/termo">,
) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Faça login." }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Acesso negado." }, { status: 403 });

  const data = await getTermData((await params).id);
  if (!data) return Response.json({ error: "Solicitação não encontrada." }, { status: 404 });
  if (data.status !== "APPROVED") {
    return Response.json({ error: "O termo só existe para adoções aprovadas." }, { status: 409 });
  }

  const pdf = await buildAdoptionTerm(data);
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="termo-de-adocao-${data.animal.slug}.pdf"`,
      // Tem dados pessoais do adotante.
      "Cache-Control": "private, no-store",
    },
  });
}
