import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "./cn";

// Botões do design system (KAN-76). Cores pelos tokens de app/globals.css (KAN-15).

export type ButtonVariant = "primary" | "secondary" | "donate" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60";

const variants: Record<ButtonVariant, string> = {
  // Ação principal da tela: no máximo uma por área.
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  // Ações secundárias e "voltar".
  secondary: "border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900",
  // Tudo que leva ao abrigo: doar, ajudar (branco sobre donate-700 = 5,9:1).
  donate: "bg-donate-700 text-white hover:bg-donate-800",
  // Ações destrutivas (excluir conta).
  danger: "bg-red-700 text-white hover:bg-red-800",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5",
  lg: "px-7 py-3",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  block = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  // Ocupa a largura toda (ex.: botão de compra no celular).
  block?: boolean;
  className?: string;
} = {}) {
  return cn(base, variants[variant], sizes[size], block && "w-full", className);
}

type Style = { variant?: ButtonVariant; size?: ButtonSize; block?: boolean };

export function Button({
  variant,
  size,
  block,
  className,
  type = "button",
  ...props
}: Style & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={buttonClasses({ variant, size, block, className })} {...props} />
  );
}

export function ButtonLink({
  variant,
  size,
  block,
  className,
  ...props
}: Style & ComponentProps<typeof Link>) {
  return <Link className={buttonClasses({ variant, size, block, className })} {...props} />;
}
