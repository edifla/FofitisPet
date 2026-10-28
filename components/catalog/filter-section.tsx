import type { ReactNode } from "react";
import { ChevronIcon } from "@/components/ui/icons";

// Grupo recolhível da barra de filtros (loja e adoção).
export function FilterSection({
  title,
  open = true,
  children,
}: {
  title: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={open} className="group border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
      <summary className="flex cursor-pointer list-none items-center justify-between font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronIcon className="size-4 text-zinc-500 transition-transform group-open:rotate-90" />
      </summary>
      <div className="pt-3">{children}</div>
    </details>
  );
}
