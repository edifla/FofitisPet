# Publicar numa VPS com Coolify (KAN-53, KAN-58)

A FofitisPet sobe numa VPS da Hostinger com o **Coolify**, um painel gratuito que publica o site a
partir do GitHub, cuida do HTTPS e faz backup do banco. Ela sobe como **beta fechado com pagamento
simulado**: o pagamento real só entra com o MEI (KAN-13) e o Mercado Pago (KAN-55).

O que roda na VPS:

- **o site**, a partir do [`Dockerfile`](../Dockerfile). Ao subir, ele aplica as migrações do banco
  e abre a porta 3000.
- **o PostgreSQL 17**, criado pelo próprio Coolify, com backup agendado.
- **um volume permanente** em `/app/storage`, para as fotos enviadas pelo admin.

> Os nomes dos menus do Coolify e da Hostinger podem mudar um pouco entre versões. Se algo não
> bater, procure pelo nome mais parecido.

## 1. Contratar a VPS

1. Na Hostinger, escolha o plano **KVM 2** (2 vCPU, 8 GB). O KVM 1 roda o site, mas sobra pouca
   memória na hora de compilar cada versão nova.
2. Na **localização**, escolha **Brasil (São Paulo)** se aparecer. Se não aparecer, escolha a mais
   próxima (Estados Unidos).
3. No **sistema operacional**, escolha o modelo com **Coolify** (fica em "Aplicativos" ou "Painéis").
4. Crie uma senha de root forte e, se souber, cadastre uma chave SSH.

## 2. Primeiro acesso ao Coolify

1. Abra `http://IP-DA-VPS:8000`. O IP aparece no painel da Hostinger.
2. **Crie a conta de administrador do Coolify na hora**: a primeira pessoa que abrir essa página
   vira dona do painel.
3. Siga o assistente e escolha o servidor **localhost** (a própria VPS).

## 3. Ligar o GitHub

1. Em **Sources**, adicione um **GitHub App**.
2. Instale o app só no repositório **edifla/FofitisPet**.

## 4. Criar o banco

1. Crie um projeto **FofitisPet** e, dentro dele, **+ New** > **Database** > **PostgreSQL 17**.
2. Dê o nome `fofitispet-db` e inicie.
3. Copie a **URL interna** (Postgres URL internal). É ela que vai no `DATABASE_URL`.
4. Em **Backups**, ligue um **backup diário**. Se puder, mande uma cópia para fora da VPS
   (armazenamento S3, como Backblaze B2 ou Cloudflare R2): se a VPS se perder, o backup não vai
   junto.

## 5. Criar o site

1. No mesmo projeto, **+ New** > **Application** > o GitHub App > **edifla/FofitisPet**, branch
   **master**.
2. **Build Pack**: **Dockerfile**. **Porta**: `3000`.
3. Em **Environment Variables**, cadastre os valores abaixo. Gere cada segredo com
   `openssl rand -hex 32`, no Terminal do Coolify ou no seu computador: o resultado só tem letras e
   números, então não atrapalha a interpolação de variáveis. Em todas, deixe **Runtime: Available in
   the container**. O campo **Build time** muda: só `APP_URL` e `BETA_MODE` precisam estar
   disponíveis na compilação, porque partes do site (metadados, robots.txt, faixa do beta) são
   montadas nessa hora. **Segredos nunca na compilação.**

   | Variável                   | Valor                                                          | Build time |
   | -------------------------- | -------------------------------------------------------------- | ---------- |
   | `DATABASE_URL`             | a URL interna do passo 4                                       | Não        |
   | `AUTH_SECRET`              | um segredo gerado                                              | Não        |
   | `AUTH_TRUST_HOST`          | `true`                                                         | Não        |
   | `APP_URL`                  | o endereço do site (passo 6), ex.: `https://fofitispet.com.br` | **Sim**    |
   | `CRON_SECRET`              | outro segredo gerado                                           | Não        |
   | `PAYMENT_WEBHOOK_SECRET`   | outro segredo gerado                                           | Não        |
   | `BETA_MODE`                | `on`                                                           | **Sim**    |
   | `ALLOW_SIMULATED_PAYMENTS` | `true`                                                         | Não        |
   | `ANTHROPIC_API_KEY`        | a chave da Lya (pode ficar para depois)                        | Não        |

4. Em **Persistent Storage**, adicione um volume com destino `/app/storage`. Sem ele, as fotos
   somem a cada versão nova.
5. Em **Health Check**, deixe **desligado**: a verificação do Coolify usa `curl` ou `wget` dentro do
   contêiner, que a imagem não tem. O próprio `Dockerfile` já verifica `/api/saude` a cada 30
   segundos, e o Coolify espera essa verificação passar antes de trocar a versão.
6. Em **Domains**:
   - **Antes do domínio próprio**: use o endereço que o Coolify sugere, do tipo
     `https://algo.IP.sslip.io`.
   - **Com o domínio**: no registro.br, crie um registro **A** de `fofitispet.com.br` (e `www`)
     apontando para o IP da VPS. Depois coloque `https://fofitispet.com.br` aqui. O certificado
     HTTPS sai sozinho.
   - Sempre que trocar o domínio, troque também o `APP_URL` e publique de novo (**Redeploy**),
     para o site ser recompilado com o endereço novo.
7. Clique em **Deploy**. O site está no ar quando `https://SEU-ENDERECO/api/saude` responde
   `{"ok":true}`.

A cada commit no `master`, o Coolify publica a versão nova sozinho.

## 6. Criar o admin de produção

A conta de teste da seed (`admin@fofitispet.test`) **não existe em produção**, porque a seed não
roda lá.

1. No site publicado, crie a sua conta em `/cadastro`, com uma senha forte.
2. No Coolify, abra o site > **Terminal** e rode:
   ```bash
   npm run user:promote -- seu-email@exemplo.com
   ```
3. Saia e entre de novo no site: o menu "Admin" aparece.

## 7. Ligar a rotina (pedidos não pagos)

A rotina `/api/pedidos/expirar` cancela pedidos não pagos fora do prazo, devolve o estoque e limpa
registros antigos. Quem chama é o GitHub Actions, a cada 15 minutos
([`.github/workflows/rotina.yml`](../.github/workflows/rotina.yml)).

1. No GitHub, abra o repositório > **Settings** > **Secrets and variables** > **Actions** e crie:
   - `APP_URL`: o endereço do site;
   - `CRON_SECRET`: o mesmo valor do Coolify.
2. Em **Actions** > **Rotina** > **Run workflow**, rode uma vez para testar.

## 8. Segurança da VPS

- **Acesso**: entre por chave SSH e desligue o login por senha.
- **Firewall** (painel da Hostinger): deixe abertas só as portas 22, 80 e 443. A porta 8000 do
  Coolify fica aberta só enquanto você configura. Depois, dê ao painel um domínio com HTTPS (ex.:
  `painel.fofitispet.com.br`) e feche a 8000.
- **Atualizações**: mantenha o Coolify atualizado (ele avisa no painel) e ligue as atualizações
  automáticas de segurança do Ubuntu (`unattended-upgrades`).
- **Senhas e chaves**: ficam só nas variáveis do Coolify. Nunca no repositório nem no chat.

## Voltar atrás (rollback)

- **Código**: no Coolify, abra o site > **Deployments**, escolha uma versão anterior e publique de
  novo.
- **Banco**: as migrações só andam para a frente. Antes de uma migração que apague ou mude dados,
  rode um backup manual em **fofitispet-db** > **Backups**. Para restaurar, use o mesmo lugar.

## Checklist antes de abrir o beta

- [ ] `/api/saude` responde `{"ok":true}` com HTTPS.
- [ ] Volume `/app/storage` montado: envie uma foto, publique uma versão nova e veja se ela
      continua lá.
- [ ] Backup diário do banco ligado, com pelo menos um teste de restauração.
- [ ] Conta admin criada e promovida.
- [ ] Produtos, fotos e animais cadastrados no admin (a seed de exemplo não vai para produção).
- [ ] Faixa "Versão beta" aparecendo (`BETA_MODE=on`).
- [ ] Rotina rodando no GitHub Actions.
- [ ] Firewall com a porta 8000 fechada e login por senha desligado.
- [ ] Teste de ponta a ponta: cadastro, compra com cartão de teste, doação, interesse de adoção.
- [ ] Textos legais revisados (eles ainda mostram o aviso de rascunho, `LEGAL.draft`).

## Alternativa: Render

O [`render.yaml`](../render.yaml) continua no repositório: com ele, dá para publicar no Render sem
cuidar de servidor ([docs/deploy-render.md](deploy-render.md)).
