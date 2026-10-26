# FofitisPet

Loja virtual de itens para pets com dois diferenciais:

- **Adoção**: uma aba com os animais do abrigo próprio da FofitisPet, com perfil de cada animal e formulário de interesse em adoção.
- **Compra para o abrigo (doação)**: o cliente pode comprar itens da loja diretamente para o abrigo. O pedido não tem frete nem endereço e o estoque é transferido da loja para o abrigo.

> Projeto em desenvolvimento. O backlog e o andamento estão no [Jira (projeto KAN)](https://fofitispet.atlassian.net/jira/software/projects/KAN/boards/2/backlog).

## Stack

- [Next.js 16](https://nextjs.org) (App Router) com React 19 e TypeScript
- [Tailwind CSS 4](https://tailwindcss.com)
- ESLint e Prettier
- PostgreSQL 17 com [Prisma 7](https://www.prisma.io) (driver adapter `@prisma/adapter-pg`)

## Requisitos

- Node.js 22 ou superior
- npm
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) para o banco local

## Como rodar

```bash
cp .env.example .env
npm install
npm run db:up
npm run db:migrate
npm run dev
```

O `npm install` já gera o Prisma Client (script `postinstall`).

Para ter contas de teste e um catálogo de exemplo no banco local, rode `npm run db:seed`. As contas e senhas estão no topo de [`prisma/seed.mjs`](prisma/seed.mjs).

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Scripts

| Script                 | O que faz                           |
| ---------------------- | ----------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento         |
| `npm run build`        | Build de produção                   |
| `npm run start`        | Sobe o build de produção            |
| `npm run lint`         | ESLint                              |
| `npm run typecheck`    | Checagem de tipos com `tsc`         |
| `npm test`             | Testes dos fluxos críticos (Vitest) |
| `npm run format`       | Formata o código com Prettier       |
| `npm run format:check` | Verifica se o código está formatado |
| `npm run db:up`        | Sobe o Postgres do `compose.yaml`   |
| `npm run db:down`      | Para o Postgres                     |
| `npm run db:migrate`   | Cria e aplica migrations do Prisma  |
| `npm run db:studio`    | Abre o Prisma Studio                |
| `npm run db:seed`      | Cria contas e catálogo de teste     |
| `npm run user:promote` | Torna uma conta admin (`-- email`)  |

## Banco de dados

- O Postgres local roda pelo [`compose.yaml`](compose.yaml), com usuário, senha e banco definidos lá. A `DATABASE_URL` do [`.env.example`](.env.example) já aponta para ele.
- O schema fica em [`prisma/schema.prisma`](prisma/schema.prisma) e a configuração do CLI em [`prisma.config.ts`](prisma.config.ts).
- O Prisma Client é gerado em `app/generated/prisma` (fora do Git). No código, importe a instância de [`lib/prisma.ts`](lib/prisma.ts):

```ts
import { prisma } from "@/lib/prisma";
```

## Contas e acesso

- Login por e-mail e senha com [Auth.js](https://authjs.dev) (sessão JWT em cookie). A configuração fica em [`auth.ts`](auth.ts).
- Toda checagem de permissão passa por [`lib/dal.ts`](lib/dal.ts) (`requireUser`, `requireAdmin`). O [`proxy.ts`](proxy.ts) só redireciona cedo quem não tem sessão.
- Para criar o primeiro admin, cadastre a conta em `/cadastro` e rode `npm run user:promote -- email@exemplo.com`.
- Sem serviço de e-mail ainda (KAN-54): os e-mails, como o de recuperação de senha, aparecem no log do `npm run dev`.

## Integração contínua

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda em cada pull request e em push no `master`: instala as dependências, roda lint, checagem de formatação, build, checagem de tipos e testes.

## Testes

Os testes em [`tests/`](tests) cobrem os fluxos críticos (KAN-47): checkout, compra para o abrigo, adoção e webhooks de pagamento. Eles chamam a camada de serviço e as rotas de API contra um Postgres de verdade, num banco separado criado na hora (`<banco>_test`, ao lado do `DATABASE_URL`), então não mexem nos dados de desenvolvimento. Com o banco no ar (`npm run db:up`), rode `npm test`.

## Como contribuir

1. Crie uma branch a partir do `master` com a chave do card do Jira, por exemplo `feat/KAN-22-catalogo`.
2. Use mensagens de commit em português com a chave do card, por exemplo `feat: catálogo com busca (KAN-22)`.
3. Antes de abrir o PR, rode `npm run lint`, `npm run format:check`, `npm run typecheck` e `npm test`.
4. Abra o pull request para o `master` e registre o link do PR no card do Jira.

## Roadmap

O backlog está organizado em épicos:

1. Definições e formalização
2. Fundações do projeto
3. Loja
4. Compra para o abrigo
5. Adoção
6. Doações e transparência
7. Qualidade e lançamento
8. Custos e serviços
