// Argumentos de Server Actions ligados com .bind (ids, números de pedido) também vêm do navegador
// e podem ser forjados (KAN-121). Um objeto no lugar de um id, por exemplo, viraria um filtro do
// Prisma ({ not: "" }). Estas checagens recusam qualquer coisa fora do formato esperado.

export class InvalidArgumentError extends Error {}

export function idArg(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(value)) {
    throw new InvalidArgumentError("Identificador inválido.");
  }
  return value;
}

export function orderNumberArg(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
    throw new InvalidArgumentError("Número de pedido inválido.");
  }
  return value;
}

export function booleanArg(value: unknown): boolean {
  if (typeof value !== "boolean") throw new InvalidArgumentError("Valor inválido.");
  return value;
}
