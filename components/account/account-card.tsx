import type { ReactNode } from "react";
import { cn } from "@/components/ui/cn";

// Bloco com título das páginas da área "Minha conta".
export function AccountCard({
  title,
  description,
  action,
  tone = "default",
  children,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "default" | "danger";
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-5 rounded-3xl bg-surface p-5 shadow-sm ring-1 sm:p-6",
        tone === "danger"
          ? "ring-red-200 dark:ring-red-900/60"
          : "ring-zinc-200/80 dark:ring-zinc-800",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            className={cn(
              "text-lg font-semibold",
              tone === "danger" && "text-red-800 dark:text-red-300",
            )}
          >
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
