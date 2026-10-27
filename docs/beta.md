# Beta fechado

Guia da KAN-52 para testar o site com um grupo pequeno antes do lançamento. O código já tem o
que o beta precisa; o teste com as pessoas é feito pela equipe.

## Antes de começar

1. Publicar o site num ambiente de teste (KAN-53/58) com:
   - `BETA_MODE="on"`: mostra a faixa "Versão beta" no topo, com o link para o feedback;
   - `ALLOW_SIMULATED_PAYMENTS="true"` e `PAYMENT_PROVIDER="simulado"`: pagamentos simulados, sem
     cobrar ninguém;
   - `APP_URL` com o endereço do ambiente.
2. Rodar o seed (`npm run db:seed`) ou cadastrar alguns produtos, animais, kits e uma campanha
   reais, para o teste parecer de verdade.
3. Criar uma conta de admin para quem vai responder às solicitações de adoção.

## Quem convidar (5 a 10 pessoas)

- 2 ou 3 tutores de pet que comprariam na loja;
- 1 ou 2 pessoas interessadas em adotar;
- 1 ou 2 pessoas que doariam ao abrigo;
- 1 pessoa da equipe do abrigo, para usar o painel (adoções, consumo, fotos da transparência);
- pelo menos 1 pessoa que use leitor de tela ou navegue só pelo teclado, se possível.

Peça para usarem o próprio celular: o site foi pensado primeiro para ele.

## Roteiro de tarefas

Mande as tarefas sem explicar as telas; o interessante é ver onde a pessoa trava. As telas
esperadas estão nos [wireframes](wireframes/index.html).

**Pagamentos de teste**: cartão `5031 4332 1540 6351`, validade qualquer data futura, CVV
`123`. O nome impresso decide o resultado: `APRO` aprova, `FUND` recusa por saldo, `OTHE`
recusa por outro motivo. No Pix, use o botão "Simular pagamento do Pix" que aparece no ambiente de
teste.

1. **Comprar**: encontre uma ração para o seu pet, coloque 2 unidades no carrinho, crie sua conta
   e finalize com entrega no seu endereço. Pague no cartão.
2. **Pagamento recusado**: repita uma compra pagando com o nome `FUND` e depois corrija.
3. **Adotar**: escolha um animal que combine com a sua casa e envie o interesse.
4. **Doar um kit**: doe um kit pela aba "Doar", de forma anônima, e encontre o comprovante.
5. **Comprar para o abrigo**: veja o que está faltando no abrigo e doe 1 unidade de um item.
6. **Transparência**: descubra quanto já foi doado e o que foi usado com os animais.
7. **Conta**: baixe os seus dados e (no fim do teste) exclua a conta.
8. **Equipe do abrigo** (admin): avance uma solicitação de adoção até "Aprovado", baixe o termo,
   registre o consumo de ração para um animal e publique uma foto na transparência.

Depois de cada tarefa, peça para a pessoa usar o link **"Enviar feedback"** (rodapé ou faixa do
beta) e contar o que achou, mesmo que tenha dado certo.

## O que observar

- Onde a pessoa hesitou, voltou ou desistiu.
- Mensagens de erro que não ajudaram.
- Termos que confundem (ex.: "doar" x "comprar para o abrigo").
- Problemas só no celular ou só no modo escuro.

## Triagem e priorização

Os comentários chegam em **`/admin/feedback`**, com a página de onde a pessoa veio. Erros técnicos
aparecem sozinhos em **`/admin/erros`**, e o uso geral em **`/admin/metricas`**.

| Prioridade | Quando usar                                                        |
| ---------- | ------------------------------------------------------------------ |
| Alta       | Impede concluir uma jornada, cobra ou entrega errado, expõe dados. |
| Média      | Confunde ou atrasa, mas dá para concluir.                          |
| Baixa      | Visual, texto, ideia para depois.                                  |

Rotina sugerida:

- **Todo dia**: ler os novos, marcar prioridade e situação ("Planejado", "Resolvido" ou
  "Descartado"), anotar o motivo.
- **Toda semana**: os de prioridade alta e média viram cards no Jira; os resolvidos são
  avisados a quem deixou contato.

## Quando encerrar o beta

- Todas as 8 tarefas concluídas por pelo menos 3 pessoas cada, sem ajuda;
- nenhum feedback de prioridade alta em aberto;
- nenhum erro novo em `/admin/erros` na última semana de teste.

Depois disso, trocar `BETA_MODE` para `"off"` e seguir para a publicação (KAN-58), com o
pagamento real (KAN-55) ligado.
