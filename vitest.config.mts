import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Testes de integração dos fluxos críticos (KAN-47): rodam a camada de serviço contra um
// Postgres de verdade, num banco separado (<banco>_test), para não mexer nos dados do dev.
export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: fileURLToPath(new URL("./", import.meta.url)) },
      // "server-only" só pode ser importado pelo Next; nos testes vira um módulo vazio.
      {
        find: /^server-only$/,
        replacement: fileURLToPath(new URL("./tests/support/empty.ts", import.meta.url)),
      },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/support/global-setup.ts"],
    setupFiles: ["tests/support/setup.ts"],
    // Os arquivos compartilham o banco de teste: um de cada vez.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
