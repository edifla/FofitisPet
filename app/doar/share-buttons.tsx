"use client";

import { useState } from "react";

// Divulgar: compartilhar a adoção pelo WhatsApp, pelo menu do aparelho ou copiando o link.
export function ShareButtons({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const text = "Conheça os cães e gatos do abrigo da FofitisPet que estão esperando uma família 🐾";
  const button =
    "inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-medium shadow-sm ring-1 ring-zinc-200 hover:ring-donate-300 dark:ring-zinc-800";

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${text}: ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={button}
      >
        Compartilhar no WhatsApp
        <span className="sr-only"> (abre em outra aba)</span>
      </a>
      <button
        type="button"
        className={button}
        onClick={async () => {
          // No celular, abre o menu de compartilhar do aparelho; no computador, copia o link.
          if (navigator.share) {
            await navigator.share({ title: "Adoção na FofitisPet", text, url }).catch(() => {});
            return;
          }
          await navigator.clipboard.writeText(url).catch(() => {});
          setCopied(true);
        }}
      >
        {copied ? "Link copiado!" : "Copiar o link"}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Link copiado." : ""}
      </span>
    </div>
  );
}
