// Torna uma conta existente administradora. Uso: npm run user:promote -- email@exemplo.com
import { withClient } from "./db.mjs";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Uso: npm run user:promote -- email@exemplo.com");
  process.exit(1);
}

const updated = await withClient((client) =>
  client.query(
    `UPDATE "User" SET role = 'ADMIN', "sessionVersion" = "sessionVersion" + 1, "updatedAt" = now()
     WHERE email = $1 RETURNING name`,
    [email],
  ),
);

if (updated.rowCount === 0) {
  console.error(`Nenhuma conta com o e-mail ${email}. Crie a conta em /cadastro primeiro.`);
  process.exit(1);
}
// A versão da sessão sobe para a pessoa entrar de novo e receber o novo papel na sessão.
console.log(`${updated.rows[0].name} agora é admin. Peça para sair e entrar de novo.`);
