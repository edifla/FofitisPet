import type { ReactNode } from "react";
import { cn } from "./cn";

// Grid e layout mobile first (KAN-79). Uma coluna no celular, mais colunas a partir de sm/md/lg.

export type ContainerSize = "narrow" | "text" | "default" | "wide";

const widths: Record<ContainerSize, string> = {
  narrow: "max-w-2xl", // formulários
  text: "max-w-3xl", // textos e resumos
  default: "max-w-5xl", // a maior parte das páginas
  wide: "max-w-6xl", // listagens com filtros
};

// Largura e respiro da página. Usar no <main> (o cabeçalho e o rodapé usam "default").
export function containerClasses(size: ContainerSize = "default", className?: string) {
  return cn("mx-auto w-full flex-1 px-4 py-8", widths[size], className);
}

const columns = {
  // Cards de produtos e animais.
  cards: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3",
  // Itens menores (kits, necessidades do abrigo).
  compact: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
  // Dois blocos lado a lado (campanhas, tabelas da transparência).
  halves: "grid grid-cols-1 gap-4 md:grid-cols-2",
  // Números em destaque.
  stats: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
} as const;

export type GridPreset = keyof typeof columns;

export function gridClasses(preset: GridPreset = "cards", className?: string) {
  return cn(columns[preset], className);
}

// Título da página, com descrição e ações opcionais.
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {description && <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
}
