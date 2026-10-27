import { Nunito } from "next/font/google";

// Fonte arredondada só nos títulos da adoção.
const nunito = Nunito({ subsets: ["latin"], variable: "--font-adocao", weight: ["600", "800"] });

// Área de adoção com identidade própria: azul e mais acolhedora que a loja. O tema troca as cores
// dos componentes do design system (botões, links, foco) só aqui dentro (app/globals.css).
export default function AdoptionLayout({ children }: LayoutProps<"/adocao">) {
  return <div className={`theme-adocao ${nunito.variable} flex flex-1 flex-col`}>{children}</div>;
}
