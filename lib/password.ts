import "server-only";
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

// Hash de senha com scrypt (nativo do Node). Formato guardado: scrypt$N$r$p$salt$hash (base64).
const PARAMS = { N: 16384, r: 8, p: 1 };
const KEY_LENGTH = 64;

function deriveKey(password: string, salt: Buffer, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt, PARAMS);
  return [
    "scrypt",
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString("base64"),
    key.toString("base64"),
  ].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, N, r, p, salt, hash] = stored.split("$");
  if (algorithm !== "scrypt" || !salt || !hash) return false;

  const expected = Buffer.from(hash, "base64");
  const key = await deriveKey(password, Buffer.from(salt, "base64"), {
    N: Number(N),
    r: Number(r),
    p: Number(p),
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}
