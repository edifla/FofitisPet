"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CloseIcon, FilterIcon } from "@/components/ui/icons";
import { cn } from "@/components/ui/cn";

// Barra lateral de filtros retrátil: no computador, ao lado dos produtos, com "Ocultar filtros"
// (a escolha fica salva neste navegador); no celular, uma gaveta que desliza da esquerda.

const STORAGE_KEY = "fofitis:filtros-ocultos";

// Preferência salva no navegador (com fallback quando o armazenamento não está disponível).
function readHidden() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function writeHidden(hidden: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, hidden ? "1" : "0");
  } catch {
    // Sem armazenamento: vale só até recarregar.
  }
  listeners.forEach((listener) => listener());
}

export function FilterLayout({
  panel,
  activeCount,
  toolbar,
  children,
}: {
  panel: React.ReactNode;
  activeCount: number;
  toolbar: React.ReactNode;
  children: React.ReactNode;
}) {
  const desktopHidden = useSyncExternalStore(subscribe, readHidden, () => false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);

  // Gaveta do celular: Esc fecha, foco vai para o botão de fechar e a página atrás não rola.
  useEffect(() => {
    if (!drawerOpen) return;
    closeRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        openRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const label = activeCount > 0 ? `Filtros (${activeCount})` : "Filtros";

  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-start">
      {drawerOpen && (
        <button
          type="button"
          aria-label="Fechar filtros"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-zinc-900/40 backdrop-blur-[2px] md:hidden"
        />
      )}
      <aside
        id="painel-filtros"
        aria-label="Filtros"
        className={cn(
          // Celular: gaveta fixa à esquerda.
          "fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-sm flex-col overflow-y-auto bg-surface shadow-2xl transition-transform duration-300",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
          // Computador: barra lateral fixa ao rolar, no fluxo da página.
          "md:sticky md:top-24 md:z-auto md:max-h-[calc(100vh-7rem)] md:w-72 md:shrink-0 md:translate-x-0 md:rounded-3xl md:border md:border-zinc-200 md:shadow-sm md:dark:border-zinc-800",
          desktopHidden && "md:hidden",
        )}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2 className="flex items-center gap-2 font-semibold">
            <FilterIcon /> Filtros
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="flex size-9 items-center justify-center rounded-full hover:bg-zinc-100 md:hidden dark:hover:bg-zinc-800"
          >
            <CloseIcon />
            <span className="sr-only">Fechar filtros</span>
          </button>
          <button
            type="button"
            onClick={() => writeHidden(true)}
            className="hidden text-sm text-zinc-600 hover:text-brand-text md:block dark:text-zinc-400"
          >
            Ocultar
          </button>
        </div>
        {panel}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            ref={openRef}
            type="button"
            aria-expanded={drawerOpen}
            aria-controls="painel-filtros"
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 rounded-full border border-zinc-300 bg-surface px-4 py-2 text-sm font-medium md:hidden dark:border-zinc-700"
          >
            <FilterIcon className="size-4" /> {label}
          </button>
          {desktopHidden && (
            <button
              type="button"
              onClick={() => writeHidden(false)}
              className="hidden items-center gap-2 rounded-full border border-zinc-300 bg-surface px-4 py-2 text-sm font-medium md:flex dark:border-zinc-700"
            >
              <FilterIcon className="size-4" /> Mostrar {label.toLowerCase()}
            </button>
          )}
          {toolbar}
        </div>
        {children}
      </div>
    </div>
  );
}
