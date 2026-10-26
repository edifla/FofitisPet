import { execSync } from "node:child_process";
import "dotenv/config";
import { Client } from "pg";

// Cria (se preciso) o banco de teste ao lado do banco configurado e aplica as migrations.
// Ex.: .../fofitispet → .../fofitispet_test. Precisa de permissão para criar bancos.
export default async function setup() {
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error("DATABASE_URL não configurado.");
  const url = new URL(base);
  const name = `${url.pathname.slice(1)}_test`;
  if (!/^[a-z0-9_]+$/.test(name)) throw new Error(`Nome de banco inesperado: ${name}`);

  const admin = new URL(base);
  admin.pathname = "/postgres";
  const client = new Client({ connectionString: admin.toString() });
  await client.connect();
  const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [name]);
  if (exists.rowCount === 0) await client.query(`CREATE DATABASE "${name}"`);
  await client.end();

  url.pathname = `/${name}`;
  process.env.DATABASE_URL = url.toString();
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: url.toString() },
    stdio: "pipe",
  });
}
