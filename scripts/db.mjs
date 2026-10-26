// Utilitários para scripts de linha de comando, fora do Next.
// Usa o driver pg direto porque o Prisma Client gerado é TypeScript.
import "dotenv/config";
import { randomBytes, scrypt } from "node:crypto";
import pg from "pg";

export async function withClient(fn) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

// Mesmo formato de lib/password.ts (scrypt$N$r$p$salt$hash); mantenha os dois iguais.
export function hashPassword(password) {
  const params = { N: 16384, r: 8, p: 1 };
  const salt = randomBytes(16);
  return new Promise((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, 64, params, (error, key) =>
      error
        ? reject(error)
        : resolve(
            [
              "scrypt",
              params.N,
              params.r,
              params.p,
              salt.toString("base64"),
              key.toString("base64"),
            ].join("$"),
          ),
    );
  });
}
