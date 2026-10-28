import type { SVGProps } from "react";

// Carinhas de cachorro e gato, de traço simples, para o filtro da adoção. Decorativas (aria-hidden):
// o texto ao lado dá o nome.

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

export const DogFaceIcon = (p: IconProps) => (
  <Icon {...p}>
    {/* Orelhas caídas, focinho e língua. */}
    <path d="M7 5.5C5 4.5 3 5.5 3 8.5c0 2.5 1.2 4 2.6 4.3" />
    <path d="M17 5.5c2-1 4 0 4 3 0 2.5-1.2 4-2.6 4.3" />
    <path d="M6.5 9c0-2.5 2.4-4.5 5.5-4.5s5.5 2 5.5 4.5v4.5c0 3.3-2.5 6-5.5 6s-5.5-2.7-5.5-6V9Z" />
    <path d="M10.7 14.2h2.6L12 15.6l-1.3-1.4ZM12 15.6v1.2M10.4 17.2c.5.5 1 .7 1.6.7s1.1-.2 1.6-.7" />
    <circle cx="9.8" cy="11" r=".6" fill="currentColor" />
    <circle cx="14.2" cy="11" r=".6" fill="currentColor" />
  </Icon>
);

export const CatFaceIcon = (p: IconProps) => (
  <Icon {...p}>
    {/* Orelhas pontudas, focinho e bigodes. */}
    <path d="M5 10.5V4l4.2 3.2a9 9 0 0 1 5.6 0L19 4v6.5c0 4.7-3.1 8.5-7 8.5s-7-3.8-7-8.5Z" />
    <path d="M11 13.8h2L12 15l-1-1.2ZM12 15v.8M10.6 16.5c.4.3.9.5 1.4.5s1-.2 1.4-.5" />
    <path d="M2.5 13.5 7 14M2.5 16 7 15.2M21.5 13.5 17 14M21.5 16 17 15.2" />
    <circle cx="9.5" cy="11.2" r=".6" fill="currentColor" />
    <circle cx="14.5" cy="11.2" r=".6" fill="currentColor" />
  </Icon>
);
