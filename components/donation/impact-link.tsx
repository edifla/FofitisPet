import Link from "next/link";
import { EyeIcon } from "@/components/ui/icons";
import { cn } from "@/components/ui/cn";

// Atalho para a transparência nas telas de doação: quem doa quer ver para onde a doação foi.
export function ImpactLink({ className }: { className?: string }) {
  return (
    <Link
      href="/transparencia"
      className={cn(
        "group flex items-center gap-4 rounded-2xl bg-surface/90 p-4 shadow-sm ring-1 ring-donate-200 transition hover:shadow-md hover:ring-donate-300 dark:ring-donate-900",
        className,
      )}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-donate-100 text-donate-800 dark:bg-donate-950 dark:text-donate-200">
        <EyeIcon />
      </span>
      <span className="flex flex-col">
        <span className="font-semibold group-hover:underline">
          Veja onde a sua doação está fazendo diferença
        </span>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Quanto foi doado, o que chegou ao abrigo e o que já virou cuidado com os animais.
        </span>
      </span>
      <span aria-hidden className="ml-auto text-xl text-donate-700 dark:text-donate-300">
        →
      </span>
    </Link>
  );
}
