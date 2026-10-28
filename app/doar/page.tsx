import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { ImpactLink } from "@/components/donation/impact-link";
import { cn } from "@/components/ui/cn";
import { BagIcon, GiftIcon, HeartIcon, MegaphoneIcon, UserIcon } from "@/components/ui/icons";
import { PageHero } from "@/components/ui/page-hero";
import { ACCEPTED_ITEMS, NOT_ACCEPTED, SHELTER_INFO } from "@/lib/shelter-info";
import { siteUrl } from "@/lib/site";
import { HelpInterestForm } from "./help-form";
import { ShareButtons } from "./share-buttons";

export const metadata: Metadata = {
  title: "Doar",
  description:
    "Ajude o abrigo da FofitisPet além da loja: doe itens, seja voluntário, divulgue os animais e saiba quando a doação em dinheiro abrir.",
};

const OPTIONS = [
  { href: "#itens", label: "Doar itens", detail: "Leve ou combine a entrega", Icon: GiftIcon },
  { href: "#dinheiro", label: "Doar dinheiro", detail: "Em breve", Icon: HeartIcon },
  { href: "#voluntariado", label: "Ser voluntário", detail: "Doe o seu tempo", Icon: UserIcon },
  { href: "#divulgar", label: "Divulgar", detail: "Ajude a achar famílias", Icon: MegaphoneIcon },
] as const;

function Section({
  id,
  title,
  Icon,
  badge,
  children,
}: {
  id: string;
  title: string;
  Icon: ComponentType<{ className?: string }>;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      className="flex scroll-mt-24 flex-col gap-4 rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-zinc-200/80 sm:p-8 dark:ring-zinc-800"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-donate-100 text-donate-800 dark:bg-donate-950 dark:text-donate-200">
          <Icon className="size-5" />
        </span>
        <h2 id={`${id}-titulo`} className="text-xl font-bold">
          {title}
        </h2>
        {badge && (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

// Aba Doar: formas de ajudar o abrigo fora da loja. Comprar itens da loja para o abrigo fica em
// Loja > Compre para o abrigo.
export default function DonatePage() {
  return (
    <main className="flex flex-1 flex-col">
      <PageHero
        tone="donate"
        eyebrow="Doar"
        title="Outras formas de ajudar o abrigo"
        description="Nem toda ajuda passa pela loja. Dá para trazer itens, doar o seu tempo, espalhar a palavra e, em breve, doar em dinheiro."
      />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pt-2 pb-14">
        <nav aria-label="Formas de ajudar">
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {OPTIONS.map(({ href, label, detail, Icon }) => (
              <li key={href}>
                <a
                  href={href}
                  className="flex h-full flex-col gap-2 rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-zinc-200/80 transition hover:-translate-y-0.5 hover:ring-donate-300 dark:ring-zinc-800"
                >
                  <Icon className="size-5 text-donate-700 dark:text-donate-300" />
                  <span className="font-semibold">{label}</span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">{detail}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <Section id="itens" title="Doar itens" Icon={GiftIcon}>
          <p className="text-zinc-700 dark:text-zinc-300">
            Tem ração, cobertor ou brinquedo sobrando em casa? Eles fazem diferença no abrigo.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold">O que aceitamos</h3>
              <ul className="flex flex-col gap-2 text-sm">
                {ACCEPTED_ITEMS.map((item) => (
                  <li key={item.title} className="flex gap-2">
                    <span aria-hidden className="text-donate-700 dark:text-donate-300">
                      ✓
                    </span>
                    <span>
                      <strong className="font-semibold">{item.title}:</strong>{" "}
                      <span className="text-zinc-600 dark:text-zinc-400">{item.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold">O que não dá para receber</h3>
              <ul className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                {NOT_ACCEPTED.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden>✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-col gap-1 rounded-2xl bg-donate-50 p-4 text-sm text-donate-950 dark:bg-donate-950 dark:text-donate-100">
            <h3 className="font-semibold">Como entregar</h3>
            {SHELTER_INFO.address ? (
              <p>
                Traga no abrigo: {SHELTER_INFO.address}
                {SHELTER_INFO.hours && ` (${SHELTER_INFO.hours})`}.
              </p>
            ) : (
              <p>Combine a entrega ou a retirada com a equipe do abrigo.</p>
            )}
            <p>
              Fale com a gente em{" "}
              <a href={`mailto:${SHELTER_INFO.contactEmail}`} className="font-semibold underline">
                {SHELTER_INFO.contactEmail}
              </a>
              .
            </p>
          </div>
        </Section>

        <Section id="dinheiro" title="Doar dinheiro" Icon={HeartIcon} badge="Em breve">
          <p className="text-zinc-700 dark:text-zinc-300">
            Estamos organizando a doação em dinheiro, com comprovante e prestação de contas na{" "}
            <Link href="/transparencia" className="underline">
              transparência
            </Link>
            . Deixe o seu e-mail e avisamos quando abrir.
          </p>
          <HelpInterestForm kind="MONEY" />
        </Section>

        <Section id="voluntariado" title="Ser voluntário" Icon={UserIcon}>
          <p className="text-zinc-700 dark:text-zinc-300">
            Passear com os cães, dar banho, brincar com os gatos, fotografar os animais para a
            adoção, ajudar em feiras e eventos. Conte como você gostaria de ajudar e a equipe entra
            em contato.
          </p>
          <HelpInterestForm kind="VOLUNTEER" />
        </Section>

        <Section id="divulgar" title="Divulgar" Icon={MegaphoneIcon}>
          <p className="text-zinc-700 dark:text-zinc-300">
            Cada compartilhamento aumenta a chance de um animal encontrar uma família. Mande a
            página da adoção para quem pode se interessar.
          </p>
          <ShareButtons url={`${siteUrl()}/adocao`} />
        </Section>

        <div className="flex flex-wrap items-center gap-4 rounded-3xl bg-brand-50 p-6 dark:bg-brand-950">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white text-brand-700 shadow-sm dark:bg-brand-900 dark:text-brand-200">
            <BagIcon className="size-5" />
          </span>
          <p className={cn("min-w-0 flex-1 text-sm text-zinc-700 dark:text-zinc-300")}>
            <strong className="font-semibold text-foreground">
              Prefere comprar algo para o abrigo?
            </strong>{" "}
            Na loja, os itens em falta e os kits prontos vão direto para o abrigo, sem frete.
          </p>
          <Link
            href="/compre-para-o-abrigo"
            className="text-sm font-semibold text-brand-text hover:underline"
          >
            Compre para o abrigo →
          </Link>
        </div>

        <ImpactLink />
      </div>
    </main>
  );
}
