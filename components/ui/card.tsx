import type { HTMLAttributes } from "react";
import { cn } from "./cn";

// Cartões do design system (KAN-77): moldura comum de produtos, animais, kits e campanhas.

export function cardClasses({
  tone = "default",
  className,
}: { tone?: "default" | "donate"; className?: string } = {}) {
  return cn(
    "flex flex-col gap-3 rounded-2xl border bg-surface p-4 shadow-sm shadow-zinc-900/5",
    tone === "donate"
      ? "border-donate-200 dark:border-donate-900"
      : "border-zinc-200 dark:border-zinc-800",
    className,
  );
}

export function Card({
  tone,
  className,
  ...props
}: { tone?: "default" | "donate" } & HTMLAttributes<HTMLDivElement>) {
  return <div className={cardClasses({ tone, className })} {...props} />;
}

// Área da foto dos cartões, com o aviso quando não há foto.
export const cardMediaClasses =
  "relative aspect-square overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900";
export const cardMediaEmptyClasses =
  "flex h-full items-center justify-center text-sm text-zinc-600 dark:text-zinc-400";
