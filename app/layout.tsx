import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PageViews } from "@/components/monitoring/page-views";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
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
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* Atalho para quem navega pelo teclado ou leitor de tela (KAN-50). */}
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-zinc-900"
        >
          Pular para o conteúdo
        </a>
        <SiteHeader />
        <div id="conteudo" tabIndex={-1} className="flex flex-1 flex-col outline-none">
          {children}
        </div>
        <SiteFooter />
        <PageViews />
      </body>
    </html>
  );
}
