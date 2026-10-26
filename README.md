# FofitisPet

Loja virtual de itens para pets com dois diferenciais:

- **Adoção**: uma aba com os animais do abrigo próprio da FofitisPet, com perfil de cada animal e formulário de interesse em adoção.
- **Compra para o abrigo (doação)**: o cliente pode comprar itens da loja diretamente para o abrigo. O pedido não tem frete nem endereço e o estoque é transferido da loja para o abrigo.

> Projeto em desenvolvimento. O backlog e o andamento estão no [Jira (projeto KAN)](https://fofitispet.atlassian.net/jira/software/projects/KAN/boards/2/backlog).

## Stack

- [Next.js 16](https://nextjs.org) (App Router) com React 19 e TypeScript
- [Tailwind CSS 4](https://tailwindcss.com)
- ESLint e Prettier
- Planejado: PostgreSQL com Prisma (KAN-84)

## Requisitos

- Node.js 22 ou superior
- npm

## Como rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Scripts

| Script                 | O que faz                           |
| ---------------------- | ----------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento         |
| `npm run build`        | Build de produção                   |
| `npm run start`        | Sobe o build de produção            |
| `npm run lint`         | ESLint                              |
| `npm run typecheck`    | Checagem de tipos com `tsc`         |
| `npm run format`       | Formata o código com Prettier       |
| `npm run format:check` | Verifica se o código está formatado |

## Integração contínua

O workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda em cada pull request e em push no `master`: instala as dependências, roda lint, checagem de formatação, build, checagem de tipos e testes (quando houver).

## Como contribuir

1. Crie uma branch a partir do `master` com a chave do card do Jira, por exemplo `feat/KAN-22-catalogo`.
2. Use mensagens de commit em português com a chave do card, por exemplo `feat: catálogo com busca (KAN-22)`.
3. Antes de abrir o PR, rode `npm run lint`, `npm run format:check` e `npm run typecheck`.
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
