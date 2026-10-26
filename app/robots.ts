import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Áreas de conta, compra e administração ficam fora dos buscadores (KAN-50).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/conta",
        "/checkout",
        "/pedidos",
        "/carrinho",
        "/api",
        "/entrar",
        "/cadastro",
        "/esqueci-senha",
        "/redefinir-senha",
      ],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
