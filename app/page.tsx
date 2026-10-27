import Link from "next/link";
import { PawIcon } from "@/components/brand/logo";
import { buttonClasses } from "@/components/ui/button";
import { BagIcon, GiftIcon, HeartIcon, HomeIcon } from "@/components/ui/icons";
import { cn } from "@/components/ui/cn";

// Os três caminhos da FofitisPet, cada um na cor da sua seção.
const PATHS = [
  {
    href: "/produtos",
    Icon: BagIcon,
    title: "Mimar o seu pet",
    text: "Ração, brinquedos e cuidados escolhidos com atenção, com frete grátis a partir de um valor.",
    cta: "Ir para a loja",
    tone: "bg-brand-50 ring-brand-100 text-brand-800 dark:bg-brand-800/20 dark:ring-brand-800/40 dark:text-brand-100",
    icon: "bg-brand-100 text-brand-800 dark:bg-brand-800/50 dark:text-brand-100",
  },
  {
    href: "/adocao",
    Icon: HeartIcon,
    title: "Adotar um amigo",
    text: "Conheça cães e gatos do nosso abrigo que estão esperando uma família para chamar de sua.",
    cta: "Conhecer os animais",
    tone: "bg-adopt-50 ring-adopt-100 text-adopt-900 dark:bg-adopt-950/60 dark:ring-adopt-900 dark:text-adopt-100",
    icon: "bg-adopt-100 text-adopt-900 dark:bg-adopt-900 dark:text-adopt-100",
  },
  {
    href: "/doar",
    Icon: GiftIcon,
    title: "Ajudar o abrigo",
    text: "Doe um kit pronto ou um item que está faltando. Ele sai da loja direto para o abrigo.",
    cta: "Quero doar",
    tone: "bg-emerald-50 ring-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:ring-emerald-900 dark:text-emerald-100",
    icon: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100",
  },
] as const;

const STEPS = [
  { title: "Você escolhe", text: "Um produto para o seu pet ou um item marcado como doável." },
  {
    title: "A loja separa",
    text: "As doações saem do nosso estoque direto para o abrigo, sem frete.",
  },
  {
    title: "O abrigo cuida",
    text: "Tudo vira ração e cuidado, e você acompanha na transparência.",
  },
];

// Página inicial: boas-vindas e os caminhos da loja, da adoção e da doação.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-100 via-brand-50 to-background dark:from-brand-800/30 dark:via-transparent">
        <PawIcon className="pointer-events-none absolute -top-6 right-4 size-40 rotate-12 text-brand-200 sm:size-56 dark:text-brand-800/40" />
        <PawIcon className="pointer-events-none absolute bottom-6 left-[55%] hidden size-16 -rotate-12 text-brand-200 md:block dark:text-brand-800/40" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pt-14 pb-12 sm:pt-20">
          <p className="w-fit rounded-full bg-surface/80 px-3 py-1 text-sm font-medium text-brand-800 shadow-sm ring-1 ring-brand-100 dark:text-brand-100 dark:ring-brand-800/40">
            Loja com um abrigo de verdade por trás
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Carinho para o seu pet,{" "}
            <span className="text-brand-text">e para quem ainda espera um lar</span>
          </h1>
          <p className="max-w-2xl text-lg text-zinc-700 dark:text-zinc-300">
            Itens para o seu pet, adoção responsável e compras que vão direto para o nosso abrigo.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/produtos" className={buttonClasses({ size: "lg" })}>
              Ver produtos
            </Link>
            <Link href="/adocao" className={buttonClasses({ size: "lg", variant: "secondary" })}>
              Conhecer quem quer um lar
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="caminhos" className="mx-auto w-full max-w-6xl px-4 py-10">
        <h2 id="caminhos" className="sr-only">
          O que você quer fazer hoje?
        </h2>
        <ul className="grid gap-5 md:grid-cols-3">
          {PATHS.map(({ href, Icon, title, text, cta, tone, icon }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "group flex h-full flex-col gap-3 rounded-3xl p-6 ring-1 transition hover:-translate-y-0.5 hover:shadow-lg",
                  tone,
                )}
              >
                <span className={cn("flex size-12 items-center justify-center rounded-2xl", icon)}>
                  <Icon className="size-6" />
                </span>
                <span className="text-xl font-bold">{title}</span>
                <span className="text-zinc-700 dark:text-zinc-300">{text}</span>
                <span className="mt-auto pt-2 font-semibold underline-offset-4 group-hover:underline">
                  {cta} →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="como-ajuda" className="mx-auto w-full max-w-6xl px-4 pb-14">
        <div className="flex flex-col gap-6 rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-zinc-200/70 sm:p-8 dark:ring-zinc-800">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100">
              <HomeIcon />
            </span>
            <h2 id="como-ajuda" className="text-2xl font-bold">
              Como a sua compra ajuda o abrigo
            </h2>
          </div>
          <ol className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-800 dark:bg-brand-800/40 dark:text-brand-100"
                >
                  {index + 1}
                </span>
                <span className="flex flex-col">
                  <span className="font-semibold">{step.title}</span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-3">
            <Link href="/abrigo" className={buttonClasses({ variant: "donate" })}>
              Ajudar o abrigo
            </Link>
            <Link href="/transparencia" className={buttonClasses({ variant: "secondary" })}>
              Ver a transparência
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
