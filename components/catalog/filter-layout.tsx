"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronIcon, CloseIcon, FilterIcon } from "@/components/ui/icons";
import { cn } from "@/components/ui/cn";

// Barra lateral de filtros retrátil, colada na lateral esquerda da tela. No computador ela recolhe
// para um trilho fino (a escolha fica salva neste navegador); no celular, é uma gaveta que desliza
// da esquerda.

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

// Cor dos detalhes da barra: a da loja ou o azul da adoção.
const accents = {
  brand: "bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-100",
  adopt: "bg-adopt-50 text-adopt-800 dark:bg-adopt-900/50 dark:text-adopt-100",
} as const;

export function FilterLayout({
  tone = "brand",
  panel,
  activeCount,
  header,
  toolbar,
  children,
}: {
  tone?: keyof typeof accents;
  panel: React.ReactNode;
  activeCount: number;
  // Topo da coluna de produtos (abertura e busca).
  header: React.ReactNode;
  toolbar: React.ReactNode;
  children: React.ReactNode;
}) {
  const collapsed = useSyncExternalStore(subscribe, readHidden, () => false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // No computador a barra fica fixa na tela, logo abaixo do cabeçalho: a faixa de recado acima
  // dele some ao rolar, então o topo da barra acompanha o fim do cabeçalho (--topo). O rodapé
  // ganha um recuo do tamanho da barra (data-filtros no <body>, app/globals.css).
  useEffect(() => {
    const root = rootRef.current;
    const header = document.querySelector("header");
    if (!root || !header) return;
    const place = () =>
      root.style.setProperty("--topo", `${Math.max(0, header.getBoundingClientRect().bottom)}px`);
    place();
    window.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
    };
  }, []);
  useEffect(() => {
    document.body.dataset.filtros = collapsed ? "recolhido" : "aberto";
    return () => {
      delete document.body.dataset.filtros;
    };
  }, [collapsed]);

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
    <div ref={rootRef} className="flex flex-1 flex-col [--topo:4rem] md:flex-row">
      {/* Reserva no fluxo da página o espaço da barra fixa. */}
      <div
        aria-hidden
        className={cn("hidden shrink-0 md:block", collapsed ? "md:w-16" : "md:w-72 lg:w-80")}
      />
      {drawerOpen && (
        <button
          type="button"
          aria-label="Fechar filtros"
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-zinc-900/40 backdrop-blur-[2px] md:hidden"
        />
      )}

      {/* Trilho do computador quando a barra está recolhida. */}
      {collapsed && (
        <div className="fixed top-(--topo) bottom-0 left-0 z-30 hidden w-16 flex-col items-center gap-3 border-r border-zinc-200 bg-surface py-5 md:flex dark:border-zinc-800">
          <button
            type="button"
            onClick={() => writeHidden(false)}
            className={cn(
              "relative flex size-10 items-center justify-center rounded-xl hover:opacity-90",
              accents[tone],
            )}
          >
            <FilterIcon />
            <span className="sr-only">Mostrar {label.toLowerCase()}</span>
            {activeCount > 0 && (
              <span
                aria-hidden
                className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary"
              >
                {activeCount}
              </span>
            )}
          </button>
          <span
            aria-hidden
            className="text-xs font-semibold tracking-widest text-zinc-500 uppercase [writing-mode:vertical-rl]"
          >
            Filtros
          </span>
        </div>
      )}

      <aside
        id="painel-filtros"
        aria-label="Filtros"
        className={cn(
          // Celular: gaveta fixa à esquerda.
          "fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-sm flex-col overflow-y-auto bg-surface shadow-2xl transition-transform duration-300",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
          // Computador: coluna fixa na lateral esquerda, do cabeçalho até o pé da tela.
          "md:top-(--topo) md:z-30 md:w-72 md:max-w-none md:translate-x-0 md:border-r md:border-zinc-200 md:shadow-none lg:w-80 md:dark:border-zinc-800",
          collapsed && "md:hidden",
        )}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <h2 className="flex items-center gap-2 font-semibold">
            <span
              className={cn("flex size-8 items-center justify-center rounded-lg", accents[tone])}
            >
              <FilterIcon className="size-4" />
            </span>
            Filtros
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
            className="hidden items-center gap-1 rounded-full px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 md:flex dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <ChevronIcon className="size-4 rotate-90" />
            Recolher
          </button>
        </div>
        {panel}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {header}
        <div className="flex w-full flex-col gap-5 px-4 pb-12 md:px-8">
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
            {toolbar}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
