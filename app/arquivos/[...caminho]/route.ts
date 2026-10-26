import { imageTypeFromKey } from "@/lib/images";
import { storage } from "@/lib/storage";

// Serve os arquivos do armazenamento local. As chaves levam um UUID, então o conteúdo de uma
// URL nunca muda e pode ficar em cache por um ano.
export async function GET(_request: Request, { params }: RouteContext<"/arquivos/[...caminho]">) {
  const { caminho } = await params;
  const key = caminho.join("/");
  const type = imageTypeFromKey(key);
  if (!type) return new Response("Não encontrado", { status: 404 });

  let data: Uint8Array | null;
  try {
    data = await storage.read(key);
  } catch {
    return new Response("Não encontrado", { status: 404 });
  }
  if (!data) return new Response("Não encontrado", { status: 404 });

  return new Response(Buffer.from(data), {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
