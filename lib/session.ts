import "server-only";
import { cookies } from "next/headers";
import { decode, type JWT } from "next-auth/jwt";

// Lê a sessão do Auth.js direto do cookie, só decodificando o JWT.
// Não usa auth() nas páginas: ele regrava o cookie a cada leitura, o que quebra a renderização
// depois de uma Server Action e usa crypto antes de ler a requisição (Cache Components).
// Com isso a sessão dura 30 dias a partir do login, sem renovação automática.

// Em HTTPS o Auth.js usa o prefixo __Secure-. O nome do cookie também é o salt da criptografia.
const SESSION_COOKIES = ["__Secure-authjs.session-token", "authjs.session-token"];

export async function readSession(): Promise<JWT | null> {
  const store = await cookies();
  for (const name of SESSION_COOKIES) {
    const token = store.get(name)?.value;
    if (!token) continue;
    try {
      // decode confere a assinatura e a validade (exp) do token.
      return await decode({ token, salt: name, secret: process.env.AUTH_SECRET! });
    } catch {
      return null;
    }
  }
  return null;
}
