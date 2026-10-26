import { beforeEach, describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site";
import { createAnimal, createVariant, resetDatabase } from "./support/factories";

// SEO (KAN-50): o sitemap só lista o que é público e o robots esconde as áreas privadas.

const base = siteUrl();

describe("sitemap e robots", () => {
  beforeEach(resetDatabase);

  it("lista produtos à venda e animais para adoção, e nada mais", async () => {
    const onSale = await createVariant();
    const hidden = await createVariant();
    await prisma.product.update({
      where: { id: hidden.productId },
      data: { active: false },
    });
    const available = await createAnimal("AVAILABLE");
    const adopted = await createAnimal("ADOPTED");

    const urls = (await sitemap()).map((entry) => entry.url);
    const product = await prisma.product.findUniqueOrThrow({ where: { id: onSale.productId } });
    const hiddenProduct = await prisma.product.findUniqueOrThrow({
      where: { id: hidden.productId },
    });
    expect(urls).toContain(`${base}/produtos/${product.slug}`);
    expect(urls).not.toContain(`${base}/produtos/${hiddenProduct.slug}`);
    expect(urls).toContain(`${base}/adocao/${available.slug}`);
    expect(urls).not.toContain(`${base}/adocao/${adopted.slug}`);
    expect(urls).toEqual(expect.arrayContaining([`${base}/privacidade`]));
    expect(urls.some((url) => /\/(admin|conta|checkout|pedidos)/.test(url))).toBe(false);
  });

  it("robots bloqueia as áreas privadas e aponta o sitemap", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rules.disallow).toEqual(
      expect.arrayContaining(["/admin", "/conta", "/checkout", "/pedidos", "/api"]),
    );
    expect(result.sitemap).toBe(`${base}/sitemap.xml`);
  });
});
