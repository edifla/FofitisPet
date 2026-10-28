import { describe, expect, it } from "vitest";
import { guessCategoryIcon } from "@/components/catalog/category-icon";
import { categorySchema } from "@/lib/validation/catalog";

// Ícone das categorias no filtro da loja.

const base = { name: "Petiscos", slug: "", description: "", parentId: "", position: "0" };

describe("ícone da categoria", () => {
  it("aceita um ícone da lista e trata vazio como automático", () => {
    expect(categorySchema.parse({ ...base, icon: "petisco" }).icon).toBe("petisco");
    expect(categorySchema.parse({ ...base, icon: "" }).icon).toBeNull();
  });

  it("recusa ícone fora da lista com mensagem em português", () => {
    const result = categorySchema.safeParse({ ...base, icon: "nao-existe" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Escolha um ícone da lista.");
  });

  it("sem escolha, adivinha pelo slug e cai no genérico", () => {
    expect(guessCategoryIcon("racao-umida")).toBe("racao-umida");
    expect(guessCategoryIcon("petiscos-naturais")).toBe("petisco");
    expect(guessCategoryIcon("coleiras-e-guias")).toBe("acessorio");
    expect(guessCategoryIcon("decoracao")).toBe("etiqueta");
  });
});
