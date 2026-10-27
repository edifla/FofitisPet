"use client";

import { MoonIcon, SunIcon } from "@/components/ui/icons";

// Chave da escolha de tema neste navegador; sem escolha, o site segue o sistema.
export const THEME_KEY = "fofitis:tema";

// Aplica a escolha salva (se houver) assim que o Next começa a carregar. Sem escolha, o CSS já
// segue o sistema sozinho (app/globals.css).
export const themeScript = `(function(){var t;try{t=localStorage.getItem("${THEME_KEY}")}catch(e){}if(t==="escuro"||t==="claro")document.documentElement.dataset.theme=t==="escuro"?"dark":"light"})()`;

// Alterna entre claro e escuro. O ícone muda só pelo CSS (dark:), sem estado no React, então o
// servidor e o navegador desenham o mesmo botão.
export function ThemeToggle() {
  function toggle() {
    const current =
      document.documentElement.dataset.theme ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const dark = current !== "dark";
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try {
      localStorage.setItem(THEME_KEY, dark ? "escuro" : "claro");
    } catch {
      // Sem armazenamento: vale só até recarregar.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex size-10 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <MoonIcon className="size-5 dark:hidden" />
      <SunIcon className="hidden size-5 dark:block" />
      <span className="sr-only">Alternar tema claro ou escuro</span>
    </button>
  );
}
