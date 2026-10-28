"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/cn";
import {
  AlertIcon,
  BoxIcon,
  ChartIcon,
  ChatIcon,
  EyeIcon,
  GiftIcon,
  GridIcon,
  HeartIcon,
  HomeIcon,
  LayersIcon,
  MegaphoneIcon,
  PaletteIcon,
  PawOutlineIcon,
  TagIcon,
  BagIcon,
  UserIcon,
} from "@/components/ui/icons";

// Menu da área administrativa, agrupado por assunto, com a página atual em destaque.
export const ADMIN_SECTIONS = [
  {
    title: "Visão geral",
    links: [
      { href: "/admin", label: "Painel", Icon: GridIcon },
      { href: "/admin/metricas", label: "Métricas", Icon: ChartIcon },
    ],
  },
  {
    title: "Loja",
    links: [
      { href: "/admin/produtos", label: "Produtos", Icon: BagIcon },
      { href: "/admin/categorias", label: "Categorias", Icon: LayersIcon },
      { href: "/admin/marcas", label: "Marcas", Icon: TagIcon },
      { href: "/admin/estoque", label: "Estoque", Icon: BoxIcon },
    ],
  },
  {
    title: "Abrigo e doações",
    links: [
      { href: "/admin/abrigo", label: "Abrigo", Icon: HomeIcon },
      { href: "/admin/campanhas", label: "Campanhas", Icon: MegaphoneIcon },
      { href: "/admin/kits", label: "Kits", Icon: GiftIcon },
      { href: "/admin/transparencia", label: "Transparência", Icon: EyeIcon },
      { href: "/admin/interessados", label: "Interessados", Icon: UserIcon },
    ],
  },
  {
    title: "Adoção",
    links: [
      { href: "/admin/animais", label: "Animais", Icon: PawOutlineIcon },
      { href: "/admin/adocoes", label: "Adoções", Icon: HeartIcon },
    ],
  },
  {
    title: "Sistema",
    links: [
      { href: "/admin/erros", label: "Erros", Icon: AlertIcon },
      { href: "/admin/feedback", label: "Feedback", Icon: ChatIcon },
      { href: "/admin/design", label: "Design", Icon: PaletteIcon },
    ],
  },
] as const;

export function isAdminLinkActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// O layout desenha o menu duas vezes (celular e computador, um deles escondido): o rótulo
// distingue os dois para os leitores de tela.
export function AdminNav({ label }: { label: string }) {
  const pathname = usePathname();
  return <AdminNavLinks pathname={pathname} label={label} />;
}

// Também usado sem destaque enquanto o menu interativo carrega.
export function AdminNavLinks({ pathname, label }: { pathname: string | null; label: string }) {
  return (
    <nav aria-label={label} className="flex flex-col gap-5">
      {ADMIN_SECTIONS.map((section) => (
        <div key={section.title} className="flex flex-col gap-1">
          <p className="px-3 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
            {section.title}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.links.map(({ href, label, Icon }) => {
              const active = isAdminLinkActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-brand-50 text-brand-800 shadow-sm ring-1 ring-brand-100 dark:bg-brand-900/40 dark:text-brand-100 dark:ring-brand-900"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/70",
                    )}
                  >
                    <Icon className="size-[18px]" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
