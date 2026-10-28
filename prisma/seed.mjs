// Dados de desenvolvimento. Rode com: npm run db:seed
// Contas de teste (só para o banco local, nunca em produção):
//   admin@fofitispet.test   / Admin1234    (ADMIN)
//   cliente@fofitispet.test / Cliente1234  (CUSTOMER)
import { hashPassword, withClient } from "../scripts/db.mjs";
import { seedDemoContent } from "./demo-content.mjs";

if (process.env.NODE_ENV === "production") {
  console.error("A seed de desenvolvimento não roda em produção.");
  process.exit(1);
}

const users = [
  {
    name: "Admin FofitisPet",
    email: "admin@fofitispet.test",
    password: "Admin1234",
    role: "ADMIN",
  },
  {
    name: "Cliente FofitisPet",
    email: "cliente@fofitispet.test",
    password: "Cliente1234",
    role: "CUSTOMER",
  },
];

await withClient(async (client) => {
  for (const user of users) {
    await client.query(
      `INSERT INTO "User" (id, name, email, "passwordHash", role, "updatedAt")
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (email) DO UPDATE
         SET name = EXCLUDED.name, "passwordHash" = EXCLUDED."passwordHash", role = EXCLUDED.role,
             "sessionVersion" = "User"."sessionVersion" + 1, "updatedAt" = now()`,
      [
        `seed_${user.role.toLowerCase()}`,
        user.name,
        user.email,
        await hashPassword(user.password),
        user.role,
      ],
    );
    console.log(`Conta ${user.email} (${user.role}) pronta.`);
  }

  await seedDemoContent(client);
});
