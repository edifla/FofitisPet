import type { ReactNode } from "react";
import { PawIcon } from "@/components/brand/logo";
import { cn } from "./cn";

// Abertura das seções do site, com a cor de cada uma: loja (marca), abrigo e doação (verde) e
// adoção (azul). Patinhas decorativas, escondidas dos leitores de tela.
const tones = {
  brand: {
    bg: "from-brand-100 to-background dark:from-brand-800/30",
    eyebrow: "text-brand-800 dark:text-brand-300",
    paw: "text-brand-200/80 dark:text-brand-900/60",
  },
  donate: {
    bg: "from-donate-100 to-background dark:from-donate-950",
    eyebrow: "text-donate-800 dark:text-donate-300",
    paw: "text-donate-200 dark:text-donate-900",
  },
  adopt: {
    bg: "from-adopt-100 to-background dark:from-adopt-950",
    eyebrow: "text-adopt-800 dark:text-adopt-300",
    paw: "text-adopt-200 dark:text-adopt-900",
  },
} as const;

export function PageHero({
  tone = "brand",
  eyebrow,
  title,
  description,
  wide = false,
  children,
}: {
  tone?: keyof typeof tones;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  // Ocupa toda a largura da coluna (telas com barra lateral), em vez de centralizar.
  wide?: boolean;
  children?: ReactNode;
}) {
  const t = tones[tone];
  return (
    <section className={cn("relative overflow-hidden bg-gradient-to-b", t.bg)}>
      <PawIcon
        className={cn(
          "pointer-events-none absolute -top-4 -right-4 size-32 rotate-12 sm:size-40",
          t.paw,
        )}
      />
      <div
        className={cn(
          "relative flex w-full flex-col gap-3 px-4 pt-10 pb-6 sm:pt-12",
          wide ? "md:px-8" : "mx-auto max-w-6xl",
        )}
      >
        {eyebrow && (
          <p className={cn("text-sm font-semibold tracking-wide uppercase", t.eyebrow)}>
            {eyebrow}
          </p>
        )}
        <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="max-w-2xl text-zinc-700 dark:text-zinc-300">{description}</p>}
        {children}
      </div>
    </section>
  );
}
