import type { SVGProps } from "react";
import { isCategoryIcon, type CategoryIconKey } from "@/lib/category-icons";

// Ícones das categorias da loja. O admin escolhe um da lista (lib/category-icons.ts); sem escolha,
// o ícone sai do slug: primeiro o slug exato, depois palavras-chave, e por fim um genérico.

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

function Icon({ className = "size-6", children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

const AllIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
  </Icon>
);

// Tigela com ração.
const BowlIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 12h18a9 9 0 0 1-18 0Z" />
    <path d="M7 12c0-2 1.5-3 3-3M12 12c0-2.5 1.5-4 3.5-4M15.5 12c.3-1 1-1.6 2-1.6" />
  </Icon>
);

// Saco de ração seca.
const SackIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 3h10l-1 3c2 1.5 3 4 3 7v5a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-5c0-3 1-5.5 3-7L7 3Z" />
    <path d="M8 6h8" />
    <circle cx="10" cy="14" r="1" />
    <circle cx="14" cy="15.5" r="1" />
    <circle cx="12" cy="12" r="1" />
  </Icon>
);

// Lata / sachê de ração úmida.
const CanIcon = (p: IconProps) => (
  <Icon {...p}>
    <ellipse cx="12" cy="6" rx="7" ry="2.5" />
    <path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6" />
    <path d="M9 12.5c1 .8 2 1.2 3 1.2s2-.4 3-1.2" />
  </Icon>
);

// Bolinha de brinquedo.
const BallIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M5 7.5c3 1 5 3.5 5.5 8M19 16.5c-3-1-5-3.5-5.5-8" />
  </Icon>
);

// Banho e higiene: gota com brilho.
const BathIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5s-6 6.4-6 10.5a6 6 0 0 0 12 0c0-4.1-6-10.5-6-10.5Z" />
    <path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" />
  </Icon>
);

// Petiscos: ossinho.
const BoneIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8.5 15.5 15.5 8.5" />
    <circle cx="6" cy="15.5" r="2" />
    <circle cx="8.5" cy="18" r="2" />
    <circle cx="15.5" cy="6" r="2" />
    <circle cx="18" cy="8.5" r="2" />
  </Icon>
);

// Acessórios: coleira com plaquinha.
const CollarIcon = (p: IconProps) => (
  <Icon {...p}>
    <ellipse cx="12" cy="9" rx="8.5" ry="4" />
    <path d="M12 13v2" />
    <circle cx="12" cy="18" r="2.5" />
  </Icon>
);

// Caminhas.
const BedIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 15c0-3 2-5 4-5h10c2 0 4 2 4 5v3H3v-3Z" />
    <path d="M6 10V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
  </Icon>
);

// Saúde e farmácia.
const HealthIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="6.5" width="17" height="13" rx="3" />
    <path d="M9 6.5V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M12 10v6M9 13h6" />
  </Icon>
);

const TagIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
    <circle cx="7.5" cy="7.5" r="1.5" />
  </Icon>
);

// Peixe e pena, para as categorias de aquário e pássaros.
const FishIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 12c3-4.5 7-6 11-6 3 0 5.5 2.5 7 6-1.5 3.5-4 6-7 6-4 0-8-1.5-11-6Z" />
    <path d="M3 12 1 9M3 12l-2 3" />
    <circle cx="16" cy="10.5" r="1" />
  </Icon>
);

const FeatherIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 4c-7 0-13 5-13 12v4" />
    <path d="M20 4c0 8-5 13-13 13M10 14l-3 3M13 11l-2 2" />
  </Icon>
);

const ICONS: Record<CategoryIconKey, (p: IconProps) => React.JSX.Element> = {
  tigela: BowlIcon,
  "racao-seca": SackIcon,
  "racao-umida": CanIcon,
  petisco: BoneIcon,
  brinquedo: BallIcon,
  higiene: BathIcon,
  acessorio: CollarIcon,
  caminha: BedIcon,
  saude: HealthIcon,
  aquario: FishIcon,
  passaro: FeatherIcon,
  etiqueta: TagIcon,
};

// Sem ícone escolhido no admin: pelo slug exato e depois por palavras-chave no começo de cada
// palavra do slug ("decoracao" não vira ração).
const BY_SLUG: Record<string, CategoryIconKey> = {
  alimentacao: "tigela",
  "racao-seca": "racao-seca",
  "racao-umida": "racao-umida",
  brinquedos: "brinquedo",
  higiene: "higiene",
};

const KEYWORDS: [RegExp, CategoryIconKey][] = [
  [/(?:^|-)(?:umid|sache|lata|pate)/, "racao-umida"],
  [/(?:^|-)(?:seca|racao)/, "racao-seca"],
  [/(?:^|-)(?:aliment|comida|comedouro|tigela)/, "tigela"],
  [/(?:^|-)(?:petisc|osso|snack)/, "petisco"],
  [/(?:^|-)(?:brinqued|bola|bolinha)/, "brinquedo"],
  [/(?:^|-)(?:higien|banho|shampoo|limpeza|areia)/, "higiene"],
  [/(?:^|-)(?:acessor|coleira|guia|roupa)/, "acessorio"],
  [/(?:^|-)(?:cama|caminha|casinha)/, "caminha"],
  [/(?:^|-)(?:saude|farmac|remedio|vacina)/, "saude"],
  [/(?:^|-)(?:aquar|peixe)/, "aquario"],
  [/(?:^|-)(?:passar|ave|gaiola)/, "passaro"],
];

export function guessCategoryIcon(slug: string): CategoryIconKey {
  return BY_SLUG[slug] ?? KEYWORDS.find(([re]) => re.test(slug))?.[1] ?? "etiqueta";
}

// Ícone da categoria: o escolhido no admin ou, sem escolha, o adivinhado pelo slug. O slug vazio é
// a opção "Todas".
export function CategoryIcon({
  slug,
  icon,
  className,
}: {
  slug: string;
  icon?: string | null;
  className?: string;
}) {
  if (slug === "" && !icon) return <AllIcon className={className} />;
  const Match = ICONS[isCategoryIcon(icon) ? icon : guessCategoryIcon(slug)];
  return <Match className={className} />;
}

// Só o desenho de um ícone da lista (seletor do admin).
export function CategoryIconGlyph({
  icon,
  className,
}: {
  icon: CategoryIconKey;
  className?: string;
}) {
  const Match = ICONS[icon];
  return <Match className={className} />;
}
