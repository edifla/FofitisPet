// Conteúdo de demonstração para o beta: produtos, animais, kits de doação e fotos de exemplo, SEM
// nenhuma conta (as contas de teste da seed têm senhas conhecidas e nunca vão para produção).
// Uso: npm run db:demo            (desenvolvimento)
//      npm run db:demo -- --confirmar   (produção: confirma que é de propósito)
// Só cria o que não existe: rodar de novo não duplica nem mexe no que foi editado no admin.
import { withClient } from "../scripts/db.mjs";
import { seedDemoContent } from "./demo-content.mjs";

if (process.env.NODE_ENV === "production" && !process.argv.includes("--confirmar")) {
  console.error(
    "Isto coloca produtos, animais e kits de exemplo no banco de PRODUÇÃO.\n" +
      "Se é isso mesmo, rode de novo com: npm run db:demo -- --confirmar",
  );
  process.exit(1);
}

await withClient(seedDemoContent);
console.log("Conteúdo de demonstração pronto. Nenhuma conta foi criada.");
