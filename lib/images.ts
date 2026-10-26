// Validação de imagens enviadas pelo admin. O tipo é conferido pelos primeiros bytes do arquivo,
// não pelo nome nem pelo tipo informado pelo navegador.

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGES_PER_UPLOAD = 6;

const signatures = [
  {
    type: "image/jpeg",
    ext: "jpg",
    match: (b: Uint8Array) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    type: "image/png",
    ext: "png",
    match: (b: Uint8Array) =>
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v),
  },
  {
    type: "image/webp",
    ext: "webp",
    match: (b: Uint8Array) =>
      String.fromCharCode(...b.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...b.slice(8, 12)) === "WEBP",
  },
] as const;

export type ImageType = (typeof signatures)[number]["type"];

export function detectImage(bytes: Uint8Array): { type: ImageType; ext: string } | null {
  const found = signatures.find((s) => s.match(bytes));
  return found ? { type: found.type, ext: found.ext } : null;
}

const typesByExt: Record<string, ImageType> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function imageTypeFromKey(key: string): ImageType | null {
  return typesByExt[key.split(".").pop()?.toLowerCase() ?? ""] ?? null;
}
