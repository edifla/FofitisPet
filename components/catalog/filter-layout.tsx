"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { PawIcon } from "@/components/brand/logo";
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

// Jeito da barra em cada área: na loja, um painel branco de filtros; na adoção, mais estreito, no
// azul suave da página e com um título acolhedor.
const tones = {
  brand: {
    title: "Filtros",
    Icon: FilterIcon,
    accent: "bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-100",
    panel: "bg-surface md:border-zinc-200 md:dark:border-zinc-800",
    head: "border-b border-zinc-200 dark:border-zinc-800",
    width: "md:w-72 lg:w-80",
    openButton: "border-zinc-300 bg-surface dark:border-zinc-700",
  },
  adopt: {
    title: "Encontre seu amigo",
    Icon: PawIcon,
    accent: "bg-white text-adopt-700 shadow-sm dark:bg-adopt-900/60 dark:text-adopt-200",
    panel: "bg-adopt-50 md:border-adopt-100 dark:bg-adopt-950 md:dark:border-adopt-900/60",
    head: "",
    width: "md:w-64 lg:w-72",
    openButton:
      "border-adopt-200 bg-white text-adopt-900 dark:border-adopt-900 dark:bg-adopt-950 dark:text-adopt-100",
  },
} as const;

export function FilterLayout({
  tone = "brand",
  panel,
  activeCount,
  header,
  toolbar,
  children,
}: {
  tone?: keyof typeof tones;
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
  const t = tones[tone];

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
    document.body.dataset.filtrosTom = tone;
    return () => {
      delete document.body.dataset.filtros;
      delete document.body.dataset.filtrosTom;
    };
  }, [collapsed, tone]);

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
        className={cn("hidden shrink-0 md:block", collapsed ? "md:w-16" : t.width)}
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
        <div
          className={cn(
            "fixed top-(--topo) bottom-0 left-0 z-30 hidden w-16 flex-col items-center gap-3 border-r py-5 md:flex",
            t.panel,
          )}
        >
          <button
            type="button"
            onClick={() => writeHidden(false)}
            className={cn(
              "relative flex size-10 items-center justify-center rounded-xl hover:opacity-90",
              t.accent,
            )}
          >
            <t.Icon className="size-5" />
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
          "fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-sm flex-col overflow-y-auto shadow-2xl transition-transform duration-300",
          t.panel,
          drawerOpen ? "translate-x-0" : "-translate-x-full",
          // Computador: coluna fixa na lateral esquerda, do cabeçalho até o pé da tela.
          "md:top-(--topo) md:z-30 md:max-w-none md:translate-x-0 md:border-r md:shadow-none",
          t.width,
          collapsed && "md:hidden",
        )}
      >
        <div className={cn("flex items-center justify-between px-5 py-4", t.head)}>
          <h2 className="flex items-center gap-2 font-semibold">
            <span className={cn("flex size-8 items-center justify-center rounded-lg", t.accent)}>
              <t.Icon className="size-4" />
            </span>
            {t.title}
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
            title="Recolher"
            className="hidden size-8 shrink-0 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-900/5 md:flex dark:text-zinc-400 dark:hover:bg-white/10"
          >
            <ChevronIcon className="size-4 rotate-180" />
            <span className="sr-only">Recolher a barra</span>
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
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium md:hidden",
                t.openButton,
              )}
            >
              <t.Icon className="size-4" /> {label}
            </button>
            {toolbar}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
