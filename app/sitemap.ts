import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site";

// Sitemap (KAN-50): páginas públicas, produtos à venda e animais para adoção. Gerado a cada
// pedido, para refletir o catálogo do momento.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const base = siteUrl();
  const [products, animals] = await Promise.all([
    prisma.product.findMany({
      where: { active: true, variants: { some: { active: true } } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.animal.findMany({
      where: { status: { in: ["AVAILABLE", "RESERVED"] } },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const pages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/produtos`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/adocao`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/abrigo`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/compre-para-o-abrigo`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/doar`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/transparencia`, changeFrequency: "daily", priority: 0.6 },
    { url: `${base}/termo-de-adocao`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/termos`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/privacidade`, changeFrequency: "yearly", priority: 0.2 },
  ];
  return [
    ...pages,
    ...products.map((p) => ({
      url: `${base}/produtos/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...animals.map((a) => ({
      url: `${base}/adocao/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
