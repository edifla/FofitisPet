"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CloseIcon } from "@/components/ui/icons";
import { cn } from "@/components/ui/cn";
import { detectSensitive, maskSensitive, SENSITIVE_REPLY } from "@/lib/lya/guard";

// Chat com a Lya, a assistente de IA da FofitisPet (KAN-127): botão flutuante com a foto dela e um
// painel de conversa. A conversa fica só neste navegador, enquanto a página estiver aberta.

type Message = { role: "user" | "assistant"; content: string };

const GREETING =
  "Oi! Eu sou a Lya, a assistente virtual da FofitisPet. Sou uma inteligência artificial e posso te ajudar com produtos, pedidos, adoção e doações. Como posso ajudar?";

const SUGGESTIONS = [
  "Qual ração é boa para gato castrado?",
  "Quero adotar um cachorro",
  "Como acompanho o meu pedido?",
  "Como funciona a doação?",
];

// Texto da Lya com um Markdown mínimo e seguro: **negrito**, listas com "- " e links só para
// páginas do próprio site. Tudo vira elemento React; nada de HTML vindo da resposta.
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const key = `${keyPrefix}-${match.index}`;
    if (match[1] !== undefined) {
      const href = match[2];
      parts.push(
        href.startsWith("/") && !href.startsWith("//") ? (
          <Link key={key} href={href} className="font-semibold underline underline-offset-2">
            {match[1]}
          </Link>
        ) : (
          match[1]
        ),
      );
    } else {
      parts.push(<strong key={key}>{match[3]}</strong>);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function RichText({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = (key: string) => {
    if (list.length === 0) return;
    blocks.push(
      <ul key={key} className="list-disc space-y-0.5 pl-5">
        {list.map((item, i) => (
          <li key={i}>{renderInline(item, `${key}-${i}`)}</li>
        ))}
      </ul>,
    );
    list = [];
  };
  text.split("\n").forEach((line, i) => {
    const item = line.match(/^\s*[-*•]\s+(.*)/);
    if (item) {
      list.push(item[1]);
      return;
    }
    flush(`l${i}`);
    if (line.trim()) blocks.push(<p key={`p${i}`}>{renderInline(line, `p${i}`)}</p>);
  });
  flush("fim");
  return <div className="flex flex-col gap-1.5">{blocks}</div>;
}

export function LyaChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const titleId = useId();
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Ao abrir, o foco vai para a caixa de texto; Esc fecha e devolve o foco ao botão.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // A última mensagem sempre à vista.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, pending]);

  // Fora do painel administrativo.
  if (pathname?.startsWith("/admin")) return null;

  async function send(text: string) {
    const content = text.trim().slice(0, 2000);
    if (!content || pending) return;
    setDraft("");
    // Cartão ou CPF: nem sai do navegador. A mensagem fica com o número escondido e a Lya
    // responde com o aviso (o servidor confere de novo, por garantia).
    const sensitive = detectSensitive(content);
    if (sensitive) {
      setMessages([
        ...messages,
        { role: "user", content: maskSensitive(content) },
        { role: "assistant", content: SENSITIVE_REPLY[sensitive] },
      ]);
      return;
    }
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    setPending(true);
    try {
      const response = await fetch("/api/lya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Só as últimas mensagens: o bastante para o contexto, sem crescer sem fim.
        body: JSON.stringify({ messages: next.slice(-20) }),
      });
      const data = (await response.json().catch(() => null)) as { reply?: string } | null;
      setMessages([
        ...next,
        {
          role: "assistant",
          content: data?.reply ?? "Não consegui responder agora. Pode tentar de novo em instantes?",
        },
      ]);
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "Parece que a conexão caiu. Pode tentar de novo?" },
      ]);
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  }

  return (
    <>
      {open && (
        <section
          role="dialog"
          aria-labelledby={titleId}
          className="fixed right-4 bottom-24 z-50 flex h-[min(36rem,calc(100dvh-8rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl ring-1 ring-donate-200 dark:ring-donate-900"
        >
          <header className="flex items-center gap-3 bg-gradient-to-r from-donate-100 to-donate-50 px-4 py-3 dark:from-donate-950 dark:to-surface">
            <Image
              src="/lya.webp"
              alt=""
              width={44}
              height={44}
              className="size-11 rounded-full ring-2 ring-donate-300"
            />
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="leading-tight font-bold">
                Lya
              </h2>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Assistente virtual (IA) da FofitisPet
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                launcherRef.current?.focus();
              }}
              className="flex size-9 items-center justify-center rounded-full hover:bg-white/60 dark:hover:bg-white/10"
            >
              <CloseIcon />
              <span className="sr-only">Fechar a conversa</span>
            </button>
          </header>

          <div
            role="log"
            aria-live="polite"
            aria-label="Mensagens da conversa"
            className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 text-sm"
          >
            {[{ role: "assistant" as const, content: GREETING }, ...messages].map((message, i) => (
              <Fragment key={i}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5",
                    message.role === "user"
                      ? "self-end rounded-br-md bg-brand-700 text-white dark:bg-brand-400 dark:text-brand-950"
                      : "self-start rounded-bl-md bg-zinc-100 dark:bg-zinc-800",
                  )}
                >
                  <span className="sr-only">{message.role === "user" ? "Você: " : "Lya: "}</span>
                  {message.role === "assistant" ? (
                    <RichText text={message.content} />
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </Fragment>
            ))}
            {messages.length === 0 && (
              <ul aria-label="Sugestões de perguntas" className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onClick={() => send(suggestion)}
                      className="rounded-full bg-donate-50 px-3 py-1.5 text-left text-xs font-medium text-donate-900 ring-1 ring-donate-200 hover:bg-donate-100 dark:bg-donate-950 dark:text-donate-100 dark:ring-donate-900"
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {pending && (
              <p className="flex items-center gap-1 self-start rounded-2xl rounded-bl-md bg-zinc-100 px-3.5 py-3 dark:bg-zinc-800">
                <span className="sr-only">A Lya está escrevendo...</span>
                {[0, 1, 2].map((dot) => (
                  <span
                    key={dot}
                    aria-hidden
                    className="size-1.5 animate-bounce rounded-full bg-zinc-500"
                    style={{ animationDelay: `${dot * 150}ms` }}
                  />
                ))}
              </p>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(draft);
            }}
            className="border-t border-zinc-200 px-3 pt-3 pb-2 dark:border-zinc-800"
          >
            <div className="flex items-end gap-2">
              <label htmlFor={`${titleId}-texto`} className="sr-only">
                Sua mensagem para a Lya
              </label>
              <textarea
                id={`${titleId}-texto`}
                ref={inputRef}
                rows={1}
                maxLength={2000}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send(draft);
                  }
                }}
                placeholder="Escreva sua dúvida..."
                className="max-h-32 min-h-10 flex-1 resize-none rounded-2xl border border-zinc-300 bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/30 dark:border-zinc-700"
              />
              <button
                type="submit"
                disabled={pending || !draft.trim()}
                className="h-10 shrink-0 rounded-full bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-50"
              >
                Enviar
              </button>
            </div>
            <p className="mt-1.5 text-center text-[0.7rem] text-zinc-500">
              A Lya é uma IA e pode errar. Não envie dados de cartão nem documentos.{" "}
              <Link href="/privacidade#lya" className="underline">
                Privacidade
              </Link>
            </p>
          </form>
        </section>
      )}

      <button
        ref={launcherRef}
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="group fixed right-4 bottom-4 z-50 flex items-center gap-2"
      >
        {!open && (
          <span className="hidden rounded-full bg-surface px-3 py-1.5 text-sm font-semibold shadow-lg ring-1 ring-donate-200 group-hover:block sm:block dark:ring-donate-900">
            Fale com a Lya
          </span>
        )}
        <Image
          src="/lya.webp"
          alt=""
          width={64}
          height={64}
          priority={false}
          className="size-16 rounded-full shadow-xl ring-4 ring-donate-200 transition-transform group-hover:scale-105 dark:ring-donate-800"
        />
        <span className="sr-only">
          {open ? "Fechar a conversa com a Lya" : "Abrir a conversa com a Lya, assistente virtual"}
        </span>
      </button>
    </>
  );
}
