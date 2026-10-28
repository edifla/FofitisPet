import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import { LyaChat } from "@/components/lya/lya-chat";
import { PageViews } from "@/components/monitoring/page-views";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { themeScript } from "@/components/theme-toggle";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FofitisPet",
    template: "%s | FofitisPet",
  },
  description: "Loja de itens para pets com adoção e compra para o abrigo.",
  // Base das URLs absolutas (Open Graph, canonical) e cartões de compartilhamento (KAN-50).
  metadataBase: new URL(siteUrl()),
  openGraph: { siteName: "FofitisPet", locale: "pt_BR", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // O script de tema muda data-theme antes da hidratação.
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        {/* Atalho para quem navega pelo teclado ou leitor de tela (KAN-50). */}
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-on-primary"
        >
          Pular para o conteúdo
        </a>
        {/* Faixa do beta fechado (KAN-52): ligada com BETA_MODE=on. */}
        {process.env.BETA_MODE === "on" && (
          <p className="bg-brand-100 px-4 py-2 text-center text-sm text-brand-800">
            Versão beta: estamos testando com poucas pessoas e os pagamentos são simulados.{" "}
            <a href="/feedback" className="font-medium underline">
              Conte o que achou
            </a>
          </p>
        )}
        <SiteHeader />
        <div id="conteudo" tabIndex={-1} className="flex flex-1 flex-col outline-none">
          {children}
        </div>
        <SiteFooter />
        {/* Lya, a assistente de IA (KAN-127). usePathname só existe no pedido: fica em Suspense. */}
        <Suspense fallback={null}>
          <LyaChat />
        </Suspense>
        {/* Tema claro/escuro antes da página aparecer, sem piscar (components/theme-toggle.tsx). */}
        <Script id="tema" strategy="beforeInteractive">
          {themeScript}
        </Script>
        {/* usePathname só existe no momento do pedido: fica fora da pré-renderização. */}
        <Suspense fallback={null}>
          <PageViews />
        </Suspense>
      </body>
    </html>
  );
}
