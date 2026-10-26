import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FileStorage } from "./types";

// Guarda os arquivos em disco (STORAGE_DIR, padrão ./storage) e os serve pela rota /arquivos.
export function createLocalDiskStorage(root = process.env.STORAGE_DIR ?? "storage"): FileStorage {
  const base = path.resolve(root);

  // Impede que uma chave como "../../.env" saia da pasta de armazenamento.
  function resolve(key: string) {
    const target = path.resolve(base, key);
    if (!target.startsWith(base + path.sep)) throw new Error(`Chave de arquivo inválida: ${key}`);
    return target;
  }

  return {
    async save(key, data) {
      const target = resolve(key);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, data);
    },
    async read(key) {
      try {
        return await readFile(resolve(key));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw error;
      }
    },
    async remove(key) {
      await rm(resolve(key), { force: true });
    },
    publicUrl(key) {
      return `/arquivos/${key}`;
    },
  };
}
