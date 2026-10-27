import type { HTMLAttributes } from "react";
import { cn } from "./cn";

// Avisos em caixa (KAN-78): informação, atenção, sucesso e erro. Contraste AA nos dois temas.

export type NoticeTone = "info" | "warning" | "success" | "danger";

const tones: Record<NoticeTone, string> = {
  info: "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100",
  warning: "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  success: "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  danger: "bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200",
};

export function noticeClasses(tone: NoticeTone = "info", className?: string) {
  return cn("rounded-md p-4 text-sm", tones[tone], className);
}

export function Notice({
  tone = "info",
  className,
  ...props
}: { tone?: NoticeTone } & HTMLAttributes<HTMLDivElement>) {
  return <div className={noticeClasses(tone, className)} {...props} />;
}
