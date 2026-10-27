import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/components/ui/cn";
import { formatValue, type ChartFormat, type ChartTone } from "./format";

// Barras horizontais com o rótulo à esquerda e o valor na ponta: para rankings (páginas mais vistas)
// e contagens por situação. Cada valor está escrito, então não precisa de dica ao passar o mouse.

const tones: Record<ChartTone, string> = {
  brand: "bg-brand-500 dark:bg-brand-400",
  donate: "bg-donate-500 dark:bg-donate-400",
  adopt: "bg-adopt-600 dark:bg-adopt-400",
};

export function BarList({
  title,
  items,
  format = "number",
  tone = "brand",
  empty = "Nada registrado no período.",
}: {
  title: string;
  items: { label: ReactNode; value: number; href?: string; key: string }[];
  format?: ChartFormat;
  tone?: ChartTone;
  empty?: string;
}) {
  if (items.length === 0) return <p className="text-sm text-zinc-500">{empty}</p>;
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul aria-label={title} className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.key} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">
              {item.href ? (
                <Link href={item.href} className="hover:underline">
                  {item.label}
                </Link>
              ) : (
                item.label
              )}
            </span>
            <span className="font-semibold tabular-nums">{formatValue(item.value, format)}</span>
          </div>
          <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800" aria-hidden>
            <div
              className={cn("h-full rounded-full", tones[tone])}
              style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
