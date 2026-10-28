import { BagIcon, GiftIcon, HeartIcon, HomeIcon } from "@/components/ui/icons";

// Links principais do cabeçalho. Cada seção tem a sua cor: loja na cor da marca, adoção em azul,
// abrigo e doações em coral. Fica fora do componente cliente para o servidor também poder usar.
// "also": outras páginas que pertencem à seção (a compra para o abrigo é parte da loja).
export const NAV_LINKS = [
  {
    href: "/produtos",
    label: "Loja",
    Icon: BagIcon,
    tone: "brand",
    also: ["/compre-para-o-abrigo"],
  },
  { href: "/adocao", label: "Adoção", Icon: HeartIcon, tone: "adopt", also: [] },
  { href: "/abrigo", label: "Abrigo", Icon: HomeIcon, tone: "donate", also: ["/transparencia"] },
  { href: "/doar", label: "Doar", Icon: GiftIcon, tone: "donate", also: [] },
] as const;

const matches = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export function isNavActive(pathname: string | null, link: (typeof NAV_LINKS)[number]) {
  return Boolean(
    pathname && (matches(pathname, link.href) || link.also.some((href) => matches(pathname, href))),
  );
}
