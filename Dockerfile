# Imagem de produção da FofitisPet (KAN-53), para a VPS com Coolify (docs/deploy-vps.md).
# Ao subir, o contêiner aplica as migrações do banco e inicia o site na porta 3000.

FROM node:22-bookworm-slim AS base
# O Prisma precisa do OpenSSL; os certificados servem para chamar serviços externos (IA, e-mail).
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
# O postinstall gera o cliente do Prisma. O endereço do banco e o segredo abaixo servem só para
# compilar; os de verdade chegam pelas variáveis do Coolify quando o site sobe.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npm ci
COPY . .
# Partes do site são montadas uma vez, na compilação (metadados, robots.txt, faixa do beta): o
# endereço público e o modo beta precisam chegar aqui. No Coolify, marque essas duas variáveis
# como "Available during build". Segredos não entram aqui.
ARG APP_URL
ARG BETA_MODE
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" AUTH_SECRET="so-para-compilar" \
  npm run build

FROM base AS run
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    STORAGE_DIR=/app/storage
# As dependências de desenvolvimento ficam: o Prisma CLI aplica as migrações e o script
# user:promote cria o admin.
COPY --from=build --chown=node:node /app /app
# Pasta das fotos enviadas pelo admin: no Coolify, monte um volume permanente aqui.
RUN mkdir -p /app/storage && chown node:node /app /app/storage
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/saude').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
