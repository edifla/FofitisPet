# Análise visual da FofitisPet (outubro de 2026)

Objetivo: entender por que o site "parece template de IA" e listar melhorias para dar uma cara
própria à FofitisPet. As telas analisadas foram: início, loja, produto, adoção, perfil do animal,
Doar, Abrigo, transparência, Minha conta e o admin, nos temas claro e escuro, no computador e no
celular.

## Por que parece template de IA

O site está correto (acessível, responsivo, consistente), mas usa os mesmos recursos que quase todo
site gerado por IA usa. Cada um sozinho é inofensivo; juntos, eles denunciam o padrão.

| Sinal                                               | Onde aparece                                                                                        | Por que denuncia                                                                   |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Fonte Geist**                                     | Todo o site (`app/layout.tsx`)                                                                      | É a fonte padrão de todo projeto Next.js novo.                                     |
| **"Eyebrow" em caixa alta acima do título**         | "LOJA FOFITISPET", "ADOÇÃO RESPONSÁVEL", "TRANSPARÊNCIA"                                            | Fórmula fixa de landing page gerada: rótulo pequeno + título grande + parágrafo.   |
| **Gradiente claro descendo até o fundo**            | Abertura de todas as seções (`PageHero`)                                                            | Mesmo fundo em todas as páginas; não há imagem, textura nem personagem.            |
| **Patinha gigante e translúcida no canto**          | Todas as aberturas                                                                                  | Decoração genérica repetida, sem relação com a página.                             |
| **Três cartões com ícone num quadradinho colorido** | Início, transparência, painel do admin                                                              | O "feature grid" mais clássico de template.                                        |
| **Tudo em pílula**                                  | Botões, chips, filtros, abas, etiquetas                                                             | Sem hierarquia: o botão principal parece igual a um filtro.                        |
| **Mesmo cartão em todo lugar**                      | `rounded-2xl/3xl` + sombra leve + anel cinza                                                        | A página vira uma pilha de caixas iguais; nada se destaca.                         |
| **Ícones de traço genéricos**                       | Menu, admin, conta                                                                                  | Bibliotecas de ícone padrão, sem ilustração própria.                               |
| **Textos de efeito**                                | "Carinho para o seu pet, e para quem ainda espera um lar", "Cada um tem uma história. Falta a sua." | Frases bonitas, mas no tom que toda IA escreve: simétricas e sem detalhe concreto. |
| **Sem fotografia de verdade na abertura**           | Início, loja, abrigo                                                                                | Um abrigo real é o maior diferencial, e ele não aparece.                           |
| **Paleta "segura"**                                 | Verde-azulado + coral + azul, em tons claros                                                        | Cores corretas, mas sem uma cor dona da marca.                                     |
| **Página de produto simples demais**                | `/produtos/[slug]`                                                                                  | Ficou para trás no redesenho: foto, título e botão, sem detalhes nem confiança.    |

## O que a FofitisPet tem de único (e o design deveria mostrar)

1. **Um abrigo de verdade por trás da loja.** Nenhum pet shop grande tem isso. Fotos reais dos
   animais, da equipe e das entregas valem mais que qualquer gradiente.
2. **A Lya.** Uma personagem com rosto, que já existe. Ela pode ser a voz e a mascote da marca, não
   só o botão do chat.
3. **Transparência.** Mostrar quanto foi doado e o que virou ração é raro; merece destaque visual
   (números grandes, fotos das entregas, linha do tempo).
4. **Histórias.** Cada animal tem uma história. O site pode contar histórias de adoção que deram
   certo, com antes e depois.

## Melhorias recomendadas

### Rápidas (pouco código, muito efeito)

1. **Trocar a fonte.** Um par com personalidade, por exemplo:
   - títulos numa fonte com curvas mais humanas (ex.: **Fraunces**, **Bricolage Grotesque** ou
     **Recoleta**), que dê calor sem ficar infantil;
   - texto numa sans legível que não seja a padrão (ex.: **Nunito Sans**, **Figtree** ou
     **DM Sans**).
2. **Tirar o "eyebrow" em caixa alta** da maioria das páginas. Deixar só onde ajuda a pessoa a se
   localizar.
3. **Hierarquia de botões.** O botão principal fica cheio e com cantos menos redondos; os
   secundários viram links ou contornos. Pílula só para chips e etiquetas.
4. **Variar os cantos e as sombras.** Usar cartão só quando agrupa algo; o resto pode ser seção
   aberta, com respiro, separadores e fundo de cor.
5. **Reescrever os textos com detalhe concreto.** Em vez de "Carinho para o seu pet...", algo
   como "Ração, brinquedos e banho para o seu pet. E parte de cada compra alimenta o Thor, a Mel e
   mais 30 amigos no abrigo." Números e nomes reais soam humanos.
6. **Dar o mesmo cuidado à página de produto** que as outras telas tiveram: galeria, benefícios,
   prazo de entrega, selo "doável ao abrigo" com explicação e produtos relacionados.

### Médias

7. **Fotografia real nas aberturas.** Início com foto do abrigo ou de um animal; Abrigo com a
   equipe; Doar com uma entrega. Um ensaio simples feito no abrigo já resolve.
8. **A Lya como personagem.** Usar a ilustração dela em estados vazios ("Nada por aqui com essa
   busca"), no 404, nos e-mails e nas dicas, com falas curtas no tom dela.
9. **Uma cor dona da marca.** Escolher uma cor principal forte (ex.: o laranja-pêssego da Lya) e
   usar as outras como apoio, em vez de três cores com o mesmo peso.
10. **Textura e traço próprios.** Pequenos detalhes desenhados à mão (pegadas, sublinhados,
    rabiscos) no lugar da patinha translúcida gigante.
11. **Layouts menos simétricos.** Alternar imagem e texto, misturar tamanhos de cartão (um grande e
    dois pequenos), usar números grandes na transparência.

### Maiores

12. **Logo e identidade feitos por um designer.** O logo atual é uma patinha genérica + o nome em
    texto. Uma marca própria muda tudo o resto.
13. **Seção de histórias de adoção** na página inicial e na adoção, com fotos de antes e depois.
14. **Biblioteca de ilustrações própria** (animais do abrigo, a Lya, cenas de cuidado) para os
    ícones e os estados vazios.
15. **Movimento com propósito:** pequenas animações ao adicionar ao carrinho, ao doar e ao
    filtrar, sem exagero.

## Sugestão de ordem

1. Fonte, botões, cantos e eyebrows (itens 1 a 4): um dia de trabalho, muda a impressão geral.
2. Textos (item 5) e página de produto (item 6).
3. Fotos reais (item 7): depende de fotografar o abrigo.
4. Lya como personagem (item 8) e a cor dona da marca (item 9).
5. Logo e ilustrações (itens 12 e 14): idealmente com um designer.
