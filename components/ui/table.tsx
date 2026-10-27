import { cn } from "./cn";

// Tabelas do admin: cartão arredondado, cabeçalho discreto, linhas espaçadas com destaque ao passar
// o mouse. Use as classes nos elementos da <table> de sempre.
export const table = {
  wrap: "overflow-x-auto rounded-2xl bg-surface shadow-sm ring-1 ring-zinc-200/80 dark:ring-zinc-800",
  table: "w-full text-left text-sm",
  head: "bg-zinc-50 text-xs tracking-wide text-zinc-500 uppercase dark:bg-zinc-900/60",
  th: "px-4 py-3 font-semibold whitespace-nowrap",
  row: "border-t border-zinc-100 transition-colors hover:bg-brand-50/50 dark:border-zinc-800 dark:hover:bg-zinc-800/40",
  td: "px-4 py-3 align-middle",
} as const;

export function tableClasses(part: keyof typeof table, className?: string) {
  return cn(table[part], className);
}
