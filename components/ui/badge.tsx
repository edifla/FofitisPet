import type { ReactNode } from "react";
import { cn } from "./cn";

// Selos sobre fotos e etiquetas de características (KAN-77). Texto branco com contraste ≥ 5:1.

const badgeTones = {
  donate: "bg-donate-700", // 5,9:1
  warning: "bg-amber-700", // 5,0:1
  neutral: "bg-zinc-900/85",
} as const;

export function Badge({
  tone = "neutral",
  position,
  children,
}: {
  tone?: keyof typeof badgeTones;
  // Canto da foto em que o selo fica.
  position?: "top-left" | "top-right";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "rounded px-2 py-0.5 text-xs text-white",
        badgeTones[tone],
        position && "absolute top-2",
        position === "top-left" && "left-2",
        position === "top-right" && "right-2",
      )}
    >
      {children}
    </span>
  );
}

// Etiqueta arredondada, ex.: temperamento do animal.
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
      {children}
    </span>
  );
}
