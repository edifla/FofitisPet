import type { SVGProps } from "react";

// Ícones das categorias da loja. As categorias vêm do admin, então o ícone é escolhido pelo slug:
// primeiro o slug exato, depois palavras-chave, e por fim um ícone genérico.

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

const EXACT: Record<string, (p: IconProps) => React.JSX.Element> = {
  "": AllIcon,
  alimentacao: BowlIcon,
  "racao-seca": SackIcon,
  "racao-umida": CanIcon,
  brinquedos: BallIcon,
  higiene: BathIcon,
};

const KEYWORDS: [RegExp, (p: IconProps) => React.JSX.Element][] = [
  [/umid|sache|lata|patê|pate/, CanIcon],
  [/seca|racao/, SackIcon],
  [/aliment|comida|comedouro|tigela/, BowlIcon],
  [/petisc|osso|snack/, BoneIcon],
  [/brinqued|bola|bolinha/, BallIcon],
  [/higien|banho|shampoo|limpeza|areia/, BathIcon],
  [/acessor|coleira|guia|roupa/, CollarIcon],
  [/cama|caminha|casinha/, BedIcon],
  [/saude|farmac|remedio|vacina/, HealthIcon],
];

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const Match = EXACT[slug] ?? KEYWORDS.find(([re]) => re.test(slug))?.[1] ?? TagIcon;
  return <Match className={className} />;
}
