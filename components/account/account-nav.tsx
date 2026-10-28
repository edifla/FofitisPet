"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/cn";
import { BagIcon, LockIcon, MapPinIcon, ShieldIcon, UserIcon } from "@/components/ui/icons";

// Abas da área "Minha conta", com a atual em destaque. No celular viram uma faixa que rola de lado.
export const ACCOUNT_LINKS = [
  { href: "/conta", label: "Meus dados", Icon: UserIcon },
  { href: "/conta/enderecos", label: "Endereços", Icon: MapPinIcon },
  { href: "/conta/pedidos", label: "Pedidos e doações", Icon: BagIcon },
  { href: "/conta/seguranca", label: "Senha e segurança", Icon: LockIcon },
  { href: "/conta/privacidade", label: "Privacidade", Icon: ShieldIcon },
] as const;

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/conta") return pathname === "/conta";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AccountNav() {
  return <AccountNavLinks pathname={usePathname()} />;
}

export function AccountNavLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Minha conta">
      <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
        {ACCOUNT_LINKS.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
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
    </nav>
  );
}
