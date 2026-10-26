// Dados de desenvolvimento. Rode com: npm run db:seed
// Contas de teste (só para o banco local, nunca em produção):
//   admin@fofitispet.test   / Admin1234    (ADMIN)
//   cliente@fofitispet.test / Cliente1234  (CUSTOMER)
import { hashPassword, withClient } from "../scripts/db.mjs";

if (process.env.NODE_ENV === "production") {
  console.error("A seed de desenvolvimento não roda em produção.");
  process.exit(1);
}

const users = [
  {
    name: "Admin FofitisPet",
    email: "admin@fofitispet.test",
    password: "Admin1234",
    role: "ADMIN",
  },
  {
    name: "Cliente FofitisPet",
    email: "cliente@fofitispet.test",
    password: "Cliente1234",
    role: "CUSTOMER",
  },
];

await withClient(async (client) => {
  for (const user of users) {
    await client.query(
      `INSERT INTO "User" (id, name, email, "passwordHash", role, "updatedAt")
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (email) DO UPDATE
         SET name = EXCLUDED.name, "passwordHash" = EXCLUDED."passwordHash", role = EXCLUDED.role,
             "sessionVersion" = "User"."sessionVersion" + 1, "updatedAt" = now()`,
      [
        `seed_${user.role.toLowerCase()}`,
        user.name,
        user.email,
        await hashPassword(user.password),
        user.role,
      ],
    );
    console.log(`Conta ${user.email} (${user.role}) pronta.`);
  }

  await seedCatalog(client);
});

// Catálogo de exemplo para navegar pela loja. Só cria o que ainda não existe (por slug e SKU),
// então rodar de novo não duplica nem sobrescreve o que foi editado no admin.
async function seedCatalog(client) {
  const categories = [
    { slug: "alimentacao", name: "Alimentação", parent: null, position: 0 },
    { slug: "racao-seca", name: "Ração seca", parent: "alimentacao", position: 0 },
    { slug: "racao-umida", name: "Ração úmida", parent: "alimentacao", position: 1 },
    { slug: "brinquedos", name: "Brinquedos", parent: null, position: 1 },
    { slug: "higiene", name: "Higiene", parent: null, position: 2 },
  ];
  const brands = [
    { slug: "premier-pet", name: "Premier Pet" },
    { slug: "golden", name: "Golden" },
    { slug: "chalesco", name: "Chalesco" },
  ];
  // [slug, nome, categoria, marca, espécies, doável, descrição, variações [sku, nome, preço, gramas, estoque]]
  const products = [
    [
      "racao-premier-caes-adultos",
      "Ração Premier Cães Adultos Raças Médias",
      "racao-seca",
      "premier-pet",
      ["DOG"],
      true,
      "Ração seca super premium para cães adultos de porte médio, com frango e arroz.",
      [
        ["SEED-PREM-1KG", "1 kg", 3990, 1000, 12],
        ["SEED-PREM-15KG", "15 kg", 24990, 15000, 4],
      ],
    ],
    [
      "racao-golden-gatos-castrados",
      "Ração Golden Gatos Castrados Salmão",
      "racao-seca",
      "golden",
      ["CAT"],
      true,
      "Ração seca para gatos castrados, sabor salmão, com controle de peso.",
      [
        ["SEED-GOLD-1KG", "1 kg", 3490, 1000, 8],
        ["SEED-GOLD-10KG", "10,1 kg", 21990, 10100, 0],
      ],
    ],
    [
      "sache-golden-gatos-frango",
      "Sachê Golden Gatos Frango",
      "racao-umida",
      "golden",
      ["CAT"],
      true,
      "Alimento úmido para gatos adultos, pedaços de frango ao molho.",
      [["SEED-SACHE-85G", "85 g", 349, 85, 60]],
    ],
    [
      "bolinha-de-borracha-macica",
      "Bolinha de Borracha Maciça",
      "brinquedos",
      "chalesco",
      ["DOG"],
      false,
      "Bolinha resistente para cães de todos os portes. Ideal para buscar e mastigar.",
      [
        ["SEED-BOLA-P", "Pequena", 1990, 80, 25],
        ["SEED-BOLA-G", "Grande", 2990, 150, 10],
      ],
    ],
    [
      "varinha-com-penas",
      "Varinha com Penas para Gatos",
      "brinquedos",
      "chalesco",
      ["CAT"],
      false,
      "Brinquedo interativo com penas coloridas para estimular o instinto de caça.",
      [["SEED-VARINHA", "Única", 2490, 60, 0]],
    ],
    [
      "shampoo-neutro-caes-gatos",
      "Shampoo Neutro para Cães e Gatos",
      "higiene",
      "chalesco",
      ["DOG", "CAT"],
      false,
      "Shampoo de pH neutro para pele sensível, 500 ml.",
      [["SEED-SHAMPOO-500", "500 ml", 2790, 550, 15]],
    ],
  ];

  for (const category of categories) {
    await client.query(
      `INSERT INTO "Category" (id, name, slug, "parentId", position, "updatedAt")
       VALUES ($1, $2, $3, (SELECT id FROM "Category" WHERE slug = $4), $5, now())
       ON CONFLICT (slug) DO NOTHING`,
      [
        `seed_cat_${category.slug}`,
        category.name,
        category.slug,
        category.parent,
        category.position,
      ],
    );
  }
  for (const brand of brands) {
    await client.query(
      `INSERT INTO "Brand" (id, name, slug, "updatedAt") VALUES ($1, $2, $3, now())
       ON CONFLICT (slug) DO NOTHING`,
      [`seed_brand_${brand.slug}`, brand.name, brand.slug],
    );
  }
  for (const [
    slug,
    name,
    category,
    brand,
    species,
    donationEligible,
    description,
    variants,
  ] of products) {
    await client.query(
      `INSERT INTO "Product" (id, name, slug, description, "categoryId", "brandId", species, "donationEligible", "updatedAt")
       VALUES ($1, $2, $3, $4, (SELECT id FROM "Category" WHERE slug = $5), (SELECT id FROM "Brand" WHERE slug = $6),
               $7::"Species"[], $8, now())
       ON CONFLICT (slug) DO NOTHING`,
      [`seed_prod_${slug}`, name, slug, description, category, brand, species, donationEligible],
    );
    for (const [sku, variantName, priceCents, weightGrams, stock] of variants) {
      const created = await client.query(
        `INSERT INTO "ProductVariant" (id, "productId", sku, name, "priceCents", "weightGrams", "updatedAt")
         VALUES ($1, (SELECT id FROM "Product" WHERE slug = $2), $3, $4, $5, $6, now())
         ON CONFLICT (sku) DO NOTHING RETURNING id`,
        [`seed_var_${sku.toLowerCase()}`, slug, sku, variantName, priceCents, weightGrams],
      );
      if (created.rowCount === 0) continue;
      const variantId = created.rows[0].id;
      await client.query(
        `INSERT INTO "StockLevel" ("variantId", location, quantity, "updatedAt")
         VALUES ($1, 'STORE', $2, now()), ($1, 'SHELTER', 0, now())`,
        [variantId, stock],
      );
      if (stock > 0) {
        await client.query(
          `INSERT INTO "StockMovement" (id, "variantId", type, "toLocation", quantity, note)
           VALUES ($1, $2, 'RESTOCK', 'STORE', $3, 'Estoque inicial da seed')`,
          [`seed_mov_${sku.toLowerCase()}`, variantId, stock],
        );
      }
    }
  }
  // Metas do abrigo (KAN-33): o que aparece em "Itens mais necessários". Só preenche se ainda
  // não houver meta, para não sobrescrever o que o admin definiu.
  const shelterTargets = { "SEED-PREM-1KG": 20, "SEED-GOLD-1KG": 15, "SEED-SACHE-85G": 120 };
  for (const [sku, target] of Object.entries(shelterTargets)) {
    await client.query(
      `UPDATE "StockLevel" SET "targetQuantity" = $2
       WHERE location = 'SHELTER' AND "targetQuantity" IS NULL
         AND "variantId" = (SELECT id FROM "ProductVariant" WHERE sku = $1)`,
      [sku, target],
    );
  }
  console.log(`Catálogo de exemplo pronto (${products.length} produtos).`);
}
