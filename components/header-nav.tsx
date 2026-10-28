"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { isNavActive, NAV_LINKS } from "@/components/nav-links";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { cn } from "@/components/ui/cn";

// Seção atual em destaque, na cor da seção.
const activeTone = {
  brand: "bg-brand-100 text-brand-800 dark:bg-brand-800/40 dark:text-brand-100",
  adopt: "bg-adopt-100 text-adopt-900 dark:bg-adopt-900/50 dark:text-adopt-100",
  donate: "bg-donate-100 text-donate-900 dark:bg-donate-900/50 dark:text-donate-100",
} as const;

export function HeaderNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
      {NAV_LINKS.map((link) => {
        const { href, label, Icon, tone } = link;
        const active = isNavActive(pathname, link);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
              active
                ? activeTone[tone]
                : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
            )}
          >
            <Icon className="size-[18px]" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

// Menu do celular: botão que abre a lista de seções e os links da conta.
export function MobileMenu({ account }: { account: { href: string; label: string }[] }) {
  const pathname = usePathname();
  // Guarda em que página o menu foi aberto: ao navegar, ele fecha sozinho.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn !== null && openOn === pathname;
  const setOpen = (value: boolean) => setOpenOn(value ? pathname : null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Fecha com Esc e devolve o foco ao botão.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenOn(null);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="menu-celular"
        onClick={() => setOpen(!open)}
        className="flex size-10 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        {open ? <CloseIcon /> : <MenuIcon />}
        <span className="sr-only">{open ? "Fechar menu" : "Abrir menu"}</span>
      </button>
      {open && (
        <div
          id="menu-celular"
          className="absolute inset-x-0 top-full border-b border-zinc-200 bg-surface px-4 pt-2 pb-5 shadow-lg dark:border-zinc-800"
        >
          <nav aria-label="Principal" className="grid grid-cols-2 gap-2">
            {NAV_LINKS.map((link) => {
              const { href, label, Icon, tone } = link;
              const active = isNavActive(pathname, link);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border border-zinc-200 px-4 py-3 font-medium dark:border-zinc-800",
                    active && activeTone[tone],
                  )}
                >
                  <Icon />
                  {label}
                </Link>
              );
            })}
          </nav>
          <ul className="mt-4 flex flex-col gap-1 border-t border-zinc-200 pt-3 text-sm dark:border-zinc-800">
            {account.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-lg px-2 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
