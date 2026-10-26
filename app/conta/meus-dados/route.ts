import { exportUserData } from "@/lib/account";
import { getCurrentUser } from "@/lib/dal";

// "Baixar meus dados" (KAN-126): cópia dos dados pessoais da conta em JSON.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Faça login." }, { status: 401 });

  const data = await exportUserData(user.id);
  const day = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="fofitispet-meus-dados-${day}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
