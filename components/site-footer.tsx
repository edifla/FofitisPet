import Link from "next/link";

// Rodapé com os links institucionais e legais (KAN-14).
export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <nav
        aria-label="Institucional"
        className="mx-auto flex w-full max-w-5xl flex-wrap gap-x-6 gap-y-2 px-4 py-6 text-sm text-zinc-600 dark:text-zinc-400"
      >
        <Link href="/transparencia">Transparência</Link>
        <Link href="/termo-de-adocao">Termo de adoção</Link>
        <Link href="/termos">Termos de uso</Link>
        <Link href="/privacidade">Política de privacidade</Link>
      </nav>
    </footer>
  );
}
