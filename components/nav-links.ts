import { BagIcon, GiftIcon, HeartIcon, HomeIcon } from "@/components/ui/icons";

// Links principais do cabeçalho. Cada seção tem a sua cor: loja na cor da marca, adoção em azul,
// abrigo e doações em verde. Fica fora do componente cliente para o servidor também poder usar.
export const NAV_LINKS = [
  { href: "/produtos", label: "Loja", Icon: BagIcon, tone: "brand" },
  { href: "/adocao", label: "Adoção", Icon: HeartIcon, tone: "adopt" },
  { href: "/abrigo", label: "Abrigo", Icon: HomeIcon, tone: "donate" },
  { href: "/doar", label: "Doar", Icon: GiftIcon, tone: "donate" },
] as const;
