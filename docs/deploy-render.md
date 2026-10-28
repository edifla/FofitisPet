# Publicar no Render (KAN-53, KAN-58)

A FofitisPet sobe no Render como **beta fechado com pagamento simulado**: o pagamento real só
entra com o MEI (KAN-13) e o Mercado Pago (KAN-55).

O arquivo [`render.yaml`](../render.yaml) é um _Blueprint_: ele cria tudo de uma vez.

- **fofitispet**: o site (Node), com um disco de 1 GB em `/var/data` para as fotos enviadas pelo
  admin.
- **fofitispet-db**: o PostgreSQL 17.

Os dois ficam na região `virginia`, a mais perto do Brasil. Planos e preços mudam: confira no
painel antes de confirmar. O disco precisa de um plano pago.

## 1. Criar pelo Blueprint

1. No painel do Render, clique em **New** > **Blueprint**.
2. Conecte o GitHub e escolha o repositório **edifla/FofitisPet**, branch **master**.
3. O Render lê o `render.yaml` e mostra o que vai criar. Ele pede os valores marcados com
   `sync: false`:
   - **APP_URL**: o endereço do site. Antes do domínio próprio, use o do Render, no formato
     `https://fofitispet.onrender.com`. O nome exato aparece depois da criação; se for outro,
     corrija em **Environment** e faça um novo deploy.
   - **ANTHROPIC_API_KEY**: a chave da Lya. Pode deixar em branco por enquanto.
4. Confirme com **Apply**. O primeiro deploy instala, compila, roda as migrações e sobe o site.
   Ele está no ar quando `https://SEU-ENDERECO/api/saude` responde `{"ok":true}`.

Os segredos `AUTH_SECRET`, `CRON_SECRET` e `PAYMENT_WEBHOOK_SECRET` são gerados pelo próprio
Render. Nunca coloque senhas ou chaves no repositório nem no chat.

## 2. Criar o admin de produção

A conta de teste da seed (`admin@fofitispet.test`) **não existe em produção**, porque a seed não
roda lá.

1. No site publicado, crie a sua conta em `/cadastro`, com uma senha forte.
2. No Render, abra o serviço **fofitispet** > **Shell** e rode:
   ```bash
   npm run user:promote -- seu-email@exemplo.com
   ```
3. Saia e entre de novo no site: o menu "Admin" aparece.

## 3. Ligar a rotina (pedidos não pagos)

A rotina `/api/pedidos/expirar` cancela pedidos não pagos fora do prazo, devolve o estoque e limpa
registros antigos. Quem chama é o GitHub Actions, a cada 15 minutos
([`.github/workflows/rotina.yml`](../.github/workflows/rotina.yml)).

1. No Render, em **fofitispet** > **Environment**, copie o valor de **CRON_SECRET**.
2. No GitHub, abra o repositório > **Settings** > **Secrets and variables** > **Actions** >
   **New repository secret** e crie dois segredos:
   - `APP_URL`: o mesmo endereço do passo 1;
   - `CRON_SECRET`: o valor copiado.
3. Em **Actions** > **Rotina** > **Run workflow**, rode uma vez para testar. A resposta mostra
   quantos pedidos foram cancelados.

## 4. Domínio próprio (quando registrar)

1. Registre `fofitispet.com.br` no [registro.br](https://registro.br). Pede CPF ou CNPJ.
2. No Render, em **fofitispet** > **Settings** > **Custom Domains**, adicione `fofitispet.com.br`
   e `www.fofitispet.com.br`. O Render mostra os registros DNS que precisam ser criados.
3. No registro.br, em **DNS**, crie esses registros. O certificado HTTPS sai sozinho.
4. Troque **APP_URL** no Render e o segredo `APP_URL` no GitHub para `https://fofitispet.com.br`.

## Publicar uma versão nova

O Render publica sozinho cada commit no `master` que passa no CI (`autoDeployTrigger:
checksPass`). As migrações rodam antes da versão nova entrar no ar.

## Voltar atrás (rollback)

- **Código**: no Render, em **fofitispet** > **Events**, escolha um deploy anterior e clique em
  **Rollback**.
- **Banco**: as migrações só andam para a frente. Antes de uma migração que apague ou mude dados,
  faça um backup em **fofitispet-db** > **Backups**. Se uma migração der errado, o deploy falha e
  a versão anterior continua no ar.

## Checklist antes de abrir o beta

- [ ] `/api/saude` responde `{"ok":true}`.
- [ ] Conta admin criada e promovida.
- [ ] Produtos, fotos e animais cadastrados no admin (a seed de exemplo não vai para produção).
- [ ] Faixa "Versão beta" aparecendo (`BETA_MODE=on`).
- [ ] Rotina rodando no GitHub Actions.
- [ ] Teste de ponta a ponta: cadastro, compra com cartão de teste, doação, interesse de adoção.
- [ ] Textos legais revisados (eles ainda mostram o aviso de rascunho, `LEGAL.draft`).
