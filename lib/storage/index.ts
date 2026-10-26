import "server-only";
import { createLocalDiskStorage } from "./local-disk";
import type { FileStorage } from "./types";

export type { FileStorage } from "./types";

// Ponto único de troca do armazenamento (Épico 8: serviço na nuvem).
export const storage: FileStorage = createLocalDiskStorage();
