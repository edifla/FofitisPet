import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentType } from "react";
import { Suspense } from "react";
import { AnimalCard } from "@/components/adoption/animal-card";
import { buttonClasses } from "@/components/ui/button";
import { BagIcon, GiftIcon, HeartIcon, HomeIcon } from "@/components/ui/icons";
import { PageHero } from "@/components/ui/page-hero";
import { searchAnimals } from "@/lib/adoption";
import { formatFoodTotal } from "@/lib/food";
import { formatBRL } from "@/lib/money";
import { getTransparencyReport } from "@/lib/transparency";

export const metadata: Metadata = {
  title: "O abrigo",
  description:
    "Conheça o abrigo da FofitisPet: o que fazemos pelos cães e gatos resgatados, quanto já foi doado e como ajudar.",
};

// O que o abrigo faz. Texto inicial: ajuste com a história real do abrigo.
const WORK = [
  {
    Icon: HomeIcon,
    title: "Acolhimento",
    text: "Cães e gatos resgatados de situações de risco ganham um lugar seguro, limpo e quentinho.",
  },
  {
    Icon: HeartIcon,
    title: "Cuidado",
    text: "Vacinas, vermífugo, castração e acompanhamento veterinário antes de cada adoção.",
  },
  {
    Icon: GiftIcon,
    title: "Uma família",
    text: "Cada animal é apresentado com calma, e a adoção é responsável, gratuita e com termo assinado.",
  },
] as const;

const card = "rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-zinc-200/80 dark:ring-zinc-800";

// Aba Abrigo: quem é o abrigo, o que faz e a transparência das doações. Comprar para o abrigo fica
// na loja (/compre-para-o-abrigo) e as outras formas de ajudar ficam na aba Doar.
export default function ShelterPage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHero
        tone="donate"
        eyebrow="Abrigo"
        title="O abrigo da FofitisPet"
        description="Um lugar onde cães e gatos resgatados recebem comida, cuidado e carinho até encontrar uma família. A loja existe para manter esse lugar de pé."
      />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pt-2 pb-14">
        <section aria-labelledby="o-que-fazemos" className="flex flex-col gap-4">
          <h2 id="o-que-fazemos" className="text-2xl font-bold">
            O que fazemos
          </h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {WORK.map(({ Icon, title, text }) => (
              <li key={title} className={`${card} flex flex-col gap-2`}>
                <Icon className="size-6 text-donate-700 dark:text-donate-300" />
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <Suspense fallback={<p className="text-zinc-500">Carregando os números...</p>}>
          <Numbers />
        </Suspense>

        <Suspense fallback={null}>
          <Animals />
        </Suspense>

        <section aria-labelledby="como-ajudar" className="flex flex-col gap-4">
          <h2 id="como-ajudar" className="text-2xl font-bold">
            Como ajudar
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <HelpCard
              href="/compre-para-o-abrigo"
              Icon={BagIcon}
              title="Compre para o abrigo"
              text="Na loja: os itens em falta e os kits prontos vão direto para o abrigo, sem frete."
            />
            <HelpCard
              href="/doar"
              Icon={GiftIcon}
              title="Outras formas de doar"
              text="Traga itens, seja voluntário, divulgue os animais e, em breve, doe em dinheiro."
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function HelpCard({
  href,
  Icon,
  title,
  text,
}: {
  href: string;
  Icon: ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className={`${card} group flex gap-4 transition hover:-translate-y-0.5 hover:shadow-md`}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-donate-100 text-donate-800 dark:bg-donate-950 dark:text-donate-200">
        <Icon className="size-5" />
      </span>
      <span className="flex flex-col gap-1">
        <span className="font-semibold group-hover:underline">{title} →</span>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">{text}</span>
      </span>
    </Link>
  );
}

async function Numbers() {
  const report = await getTransparencyReport();
  const stats = [
    { label: "Doado ao abrigo", value: formatBRL(report.raisedCents) },
    { label: "Ração entregue", value: formatFoodTotal(report.deliveredFoodGrams) },
    { label: "Ração já servida", value: formatFoodTotal(report.consumedFoodGrams) },
    { label: "Doações entregues", value: String(report.donationCount) },
  ];
  return (
    <section
      aria-labelledby="numeros"
      className="flex flex-col gap-4 rounded-3xl bg-donate-50 p-6 sm:p-8 dark:bg-donate-950/60"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="numeros" className="text-2xl font-bold">
          As doações em números
        </h2>
        <Link
          href="/transparencia"
          className="text-sm font-semibold text-donate-800 hover:underline dark:text-donate-200"
        >
          Ver a transparência completa →
        </Link>
      </div>
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-surface p-4 shadow-sm">
            <dt className="text-sm text-zinc-600 dark:text-zinc-400">{stat.label}</dt>
            <dd className="text-2xl font-bold tracking-tight">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

async function Animals() {
  const { animals, total } = await searchAnimals({});
  if (animals.length === 0) return null;
  return (
    <section aria-labelledby="esperando" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="esperando" className="text-2xl font-bold">
          Esperando por uma família
        </h2>
        <Link href="/adocao" className={buttonClasses({ variant: "secondary", size: "sm" })}>
          Ver todos ({total})
        </Link>
      </div>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {animals.slice(0, 3).map((animal) => (
          <li key={animal.id}>
            <AnimalCard animal={animal} />
          </li>
        ))}
      </ul>
    </section>
  );
}
