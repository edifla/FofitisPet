import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { FeedbackLink } from "@/components/feedback-link";

const COLUMNS = [
  {
    title: "Loja",
    links: [
      { href: "/produtos", label: "Produtos" },
      { href: "/compre-para-o-abrigo", label: "Compre para o abrigo" },
      { href: "/carrinho", label: "Carrinho" },
      { href: "/conta/pedidos", label: "Meus pedidos" },
    ],
  },
  {
    title: "Abrigo",
    links: [
      { href: "/adocao", label: "Adotar" },
      { href: "/abrigo", label: "Sobre o abrigo" },
      { href: "/doar", label: "Doar" },
      { href: "/transparencia", label: "Transparência" },
    ],
  },
  {
    title: "Institucional",
    links: [
      { href: "/termo-de-adocao", label: "Termo de adoção" },
      { href: "/termos", label: "Termos de uso" },
      { href: "/privacidade", label: "Política de privacidade" },
    ],
  },
];

// Rodapé: a missão da FofitisPet e os links da loja, do abrigo e institucionais (KAN-14).
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-100/70 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-xs text-sm text-zinc-600 dark:text-zinc-400">
            Uma loja para quem ama os seus pets, com um abrigo de verdade por trás. Parte do que
            acontece aqui vira ração, cuidado e um novo lar para quem ainda espera.
          </p>
        </div>
        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title} className="flex flex-col gap-2 text-sm">
            <h2 className="font-semibold">{column.title}</h2>
            {column.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-zinc-600 hover:text-brand-text dark:text-zinc-400"
              >
                {link.label}
              </Link>
            ))}
            {column.title === "Institucional" && (
              <span className="text-zinc-600 hover:text-brand-text dark:text-zinc-400">
                <Suspense fallback={<Link href="/feedback">Enviar feedback</Link>}>
                  <FeedbackLink />
                </Suspense>
              </span>
            )}
          </nav>
        ))}
      </div>
    </footer>
  );
}
