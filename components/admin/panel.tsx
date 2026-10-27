import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { cn } from "@/components/ui/cn";

// Peças dos painéis do admin: cartões de número (StatTile) e blocos com título (Panel).

type Tone = "brand" | "donate" | "adopt" | "amber" | "zinc";

const iconTones: Record<Tone, string> = {
  brand: "bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-200",
  donate: "bg-donate-100 text-donate-800 dark:bg-donate-950 dark:text-donate-200",
  adopt: "bg-adopt-100 text-adopt-800 dark:bg-adopt-950 dark:text-adopt-200",
  amber: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
  zinc: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export function StatTile({
  label,
  value,
  detail,
  href,
  Icon,
  tone = "brand",
}: {
  label: string;
  value: string;
  detail?: string;
  href?: string;
  Icon: ComponentType<{ className?: string }>;
  tone?: Tone;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-zinc-200/80 dark:ring-zinc-800">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</p>
        <span className={cn("flex size-9 items-center justify-center rounded-xl", iconTones[tone])}>
          <Icon className="size-[18px]" />
        </span>
      </div>
      <p className="text-3xl font-bold tracking-tight">
        {href ? (
          <Link href={href} className="hover:text-brand-text hover:underline">
            {value}
          </Link>
        ) : (
          value
        )}
      </p>
      {detail && <p className="text-sm text-zinc-500">{detail}</p>}
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-zinc-200/80 sm:p-6 dark:ring-zinc-800",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {description && <p className="text-sm text-zinc-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
