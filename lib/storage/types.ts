// Contrato de armazenamento de arquivos enviados (imagens de produtos, fotos de animais).
// Hoje há só o disco local; no Épico 8 entra um serviço na nuvem com a mesma interface.
export interface FileStorage {
  save(key: string, data: Uint8Array): Promise<void>;
  read(key: string): Promise<Uint8Array | null>;
  remove(key: string): Promise<void>;
  // Endereço público do arquivo, usado no <img>/next/image.
  publicUrl(key: string): string;
}
