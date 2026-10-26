import Link from "next/link";
import { PawIcon } from "@/components/brand/logo";

// Página inicial provisória até os wireframes (KAN-16) e o design system (KAN-17).
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="flex items-center gap-3 font-display text-4xl font-semibold tracking-tight">
        <PawIcon className="size-10 text-brand-text" />
        <span>
          Fofitis<span className="text-brand-text">Pet</span>
        </span>
      </h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Itens para o seu pet, adoção responsável e compras que vão direto para o nosso abrigo.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/produtos"
          className="rounded-md bg-primary px-4 py-2 font-medium text-on-primary hover:bg-primary-hover"
        >
          Ver produtos
        </Link>
        <Link href="/abrigo" className="rounded-md bg-emerald-700 px-4 py-2 font-medium text-white">
          Ajudar o abrigo
        </Link>
        <Link
          href="/cadastro"
          className="rounded-md border border-zinc-300 px-4 py-2 font-medium dark:border-zinc-700"
        >
          Criar conta
        </Link>
      </div>
    </main>
  );
}
