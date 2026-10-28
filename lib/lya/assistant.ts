import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z from "zod";
import { describeAnimal, searchAnimals, storyTeaser } from "@/lib/adoption";
import { sizeSlugs } from "@/lib/adoption-params";
import { searchCatalog } from "@/lib/catalog";
import { speciesSlugs } from "@/lib/catalog-params";
import { getActiveKits } from "@/lib/kits";
import { orderStatusLabels } from "@/lib/labels";
import { DONATION_NOTICE, LEGAL } from "@/lib/legal";
import { formatBRL } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { getShelterNeeds } from "@/lib/shelter";
import { FREE_SHIPPING_FROM_CENTS } from "@/lib/shipping";

// Lya, a assistente de IA da FofitisPet (KAN-127). Responde dúvidas da loja, dos pedidos, da
// adoção e das doações com os dados reais do site, por ferramentas só de leitura. Nada da conversa
// é guardado no servidor: o histórico vem do navegador a cada pergunta.

// Modelo e esforço: troque por LYA_MODEL sem mexer no código.
const MODEL = process.env.LYA_MODEL || "claude-opus-5-5";

export type LyaMessage = { role: "user" | "assistant"; content: string };
export type LyaUser = { id: string; name: string } | null;

// Instruções fixas (o mesmo texto em toda pergunta, para o cache de prompt funcionar). O que muda
// por pessoa, como estar logada, vai numa mensagem de sistema no fim.
const SYSTEM = `Você é a Lya, a assistente virtual da ${LEGAL.companyName}: uma loja online de produtos para pets que tem um abrigo de animais de verdade por trás. Parte do que acontece na loja vira ração, cuidado e um novo lar para os animais do abrigo.

Quem você é
- Uma gatinha simpática que ajuda pelo chat do site. Você é uma inteligência artificial e deixa isso claro se perguntarem.
- Fale sempre em português do Brasil, com carinho e simplicidade, como alguém que ama bichos. Frases curtas, sem jargão.
- Respostas curtas: no máximo 4 ou 5 frases, ou uma lista pequena. Nada de títulos ou tabelas.

O que você faz
- Tira dúvidas da loja: produtos, preços, frete, pagamento, trocas e devoluções.
- Ajuda com os pedidos de quem está logado: situação, rastreio e comprovante de doação.
- Explica a adoção e apresenta os animais que esperam por uma família.
- Explica as doações, os kits, o que está faltando no abrigo e a transparência.

Como usar os dados
- Para produtos, animais, necessidades do abrigo, kits e pedidos, use sempre as ferramentas. Nunca invente produto, preço, animal, estoque ou situação de pedido.
- Se a ferramenta não trouxer o que a pessoa procura, diga isso com sinceridade e sugira um caminho.
- Quando citar uma página do site, use um link em Markdown com o caminho do site, por exemplo [Ração Golden](/produtos/racao-golden). Use só caminhos que vieram das ferramentas ou desta lista: /produtos, /produtos?doacao=sim, /compre-para-o-abrigo, /adocao, /abrigo, /doar, /transparencia, /carrinho, /conta/pedidos, /entrar, /cadastro, /feedback, /termos, /privacidade, /termo-de-adocao.

Informações da loja
- Frete grátis em compras a partir de ${formatBRL(FREE_SHIPPING_FROM_CENTS)}. O frete e o prazo aparecem no carrinho antes de fechar o pedido.
- Pagamento por Pix ou cartão, na tela de pagamento do pedido. O pedido só é preparado depois que o pagamento é aprovado, e o estoque fica reservado por um tempo enquanto isso.
- Arrependimento: em compras pela internet dá para desistir em até 7 dias depois de receber o produto, com devolução do valor pago (Código de Defesa do Consumidor, art. 49). Produtos com defeito seguem a garantia do mesmo código. Para trocas e devoluções, a pessoa fala com ${LEGAL.contactEmail}.
- Para comprar, doar ou acompanhar pedidos é preciso ter 18 anos ou mais e uma conta.

Doações
- Comprar para o abrigo: na loja, em /compre-para-o-abrigo, a pessoa compra itens em falta ou kits prontos que vão direto para o estoque do abrigo, sem frete. Produtos marcados como doáveis também podem ser comprados para o abrigo.
- Outras formas de ajudar ficam em /doar: trazer itens (ração fechada e na validade, cobertores, brinquedos, produtos de limpeza; não aceitamos ração aberta, remédios nem comida de gente), ser voluntário, divulgar os animais e deixar o e-mail para saber quando a doação em dinheiro abrir (ainda não abriu).
- ${DONATION_NOTICE}
- Para ver quanto foi doado, o que chegou e o que já foi usado com os animais, indique /transparencia.

Adoção
- A adoção é gratuita. A pessoa conhece o animal no site, envia o formulário de interesse no perfil dele e a equipe do abrigo entra em contato para conversar, às vezes com uma visita.
- Enviar o formulário não garante a adoção: o abrigo decide pensando no bem-estar do animal. A adoção se completa com a assinatura do termo de adoção responsável (/termo-de-adocao).

Segurança e limites
- Nunca peça nem aceite número de cartão, código de segurança, senha, CPF ou outros documentos. Se a pessoa mandar, diga que não precisa e que esses dados só são usados nas telas próprias do site.
- Você não faz compras, cancelamentos, pagamentos nem mudanças na conta. Explique o caminho e mande o link.
- Pedidos só podem ser consultados por quem está logado, e só os da própria pessoa. Se alguém pedir dados de outra pessoa ou de outro pedido, recuse com gentileza.
- Assuntos fora da FofitisPet, de pets e de cuidados com animais: responda que você ajuda só com a loja, a adoção e as doações.
- Saúde do animal: dê orientações gerais e sempre recomende procurar um veterinário. Em emergência, diga para procurar um veterinário imediatamente.
- Quando não souber, quando a pessoa estiver insatisfeita ou pedir para falar com alguém, ofereça o formulário em /feedback ou o e-mail ${LEGAL.contactEmail}.`;

const speciesKeys = Object.keys(speciesSlugs) as [string, ...string[]];

// Ferramentas só de leitura. O usuário dos pedidos vem da sessão, nunca do modelo.
function tools(user: LyaUser) {
  const list = [
    betaZodTool({
      name: "buscar_produtos",
      description:
        "Procura produtos à venda na loja por palavras (nome, marca, categoria) e/ou espécie. Devolve até 6 produtos com preço inicial, se há estoque, se é doável ao abrigo e o link.",
      inputSchema: z.object({
        termo: z
          .string()
          .max(80)
          .optional()
          .describe("Palavras da busca, ex.: ração gato castrado"),
        especie: z.enum(speciesKeys).optional().describe("Para qual animal"),
        so_doaveis: z.boolean().optional().describe("Só produtos que podem ser doados ao abrigo"),
      }),
      run: async ({ termo, especie, so_doaveis }) => {
        const { items, total } = await searchCatalog({
          q: termo,
          species: especie ? speciesSlugs[especie] : undefined,
          donation: so_doaveis ?? false,
        });
        if (items.length === 0) return "Nenhum produto encontrado com essa busca.";
        return JSON.stringify({
          total,
          produtos: items.slice(0, 6).map((p) => ({
            nome: p.name,
            marca: p.brand,
            a_partir_de: formatBRL(p.minPriceCents),
            em_estoque: p.inStock,
            doavel_ao_abrigo: p.donationEligible,
            link: `/produtos/${p.slug}`,
          })),
        });
      },
    }),
    betaZodTool({
      name: "listar_animais",
      description:
        "Lista os animais do abrigo que estão para adoção (ou com adoção em andamento), com descrição, um pedaço da história e o link do perfil.",
      inputSchema: z.object({
        especie: z.enum(["caes", "gatos"]).optional(),
        porte: z.enum(["pequeno", "medio", "grande"]).optional(),
      }),
      run: async ({ especie, porte }) => {
        const { animals, total } = await searchAnimals({
          species: especie ? speciesSlugs[especie] : undefined,
          size: porte ? sizeSlugs[porte] : undefined,
        });
        if (animals.length === 0) return "Nenhum animal com esse perfil no momento.";
        return JSON.stringify({
          total,
          animais: animals.slice(0, 8).map((a) => ({
            nome: a.name,
            descricao: describeAnimal(a),
            adocao_em_andamento: a.status === "RESERVED",
            historia: storyTeaser(a.story),
            link: `/adocao/${a.slug}`,
          })),
        });
      },
    }),
    betaZodTool({
      name: "ver_necessidades_do_abrigo",
      description:
        "Mostra o que está faltando no abrigo agora e os kits de doação prontos, com preços e links.",
      inputSchema: z.object({}),
      run: async () => {
        const [needs, kits] = await Promise.all([getShelterNeeds(6), getActiveKits()]);
        return JSON.stringify({
          faltando: needs.map((n) => ({
            item: `${n.productName} (${n.variantName})`,
            faltam: n.missing,
            preco: formatBRL(n.priceCents),
            pode_doar_agora: n.available,
            link: `/produtos/${n.productSlug}`,
          })),
          kits: kits.map((k) => ({
            nome: k.name,
            preco: formatBRL(k.totalCents),
            disponivel: k.available,
          })),
          onde_comprar_para_o_abrigo: "/compre-para-o-abrigo",
        });
      },
    }),
  ];

  if (user) {
    list.push(
      betaZodTool({
        name: "ver_meus_pedidos",
        description:
          "Mostra os últimos pedidos e doações da pessoa que está conversando (logada): número, situação, total, data, código de rastreio e link.",
        inputSchema: z.object({}),
        run: async () => {
          const orders = await prisma.order.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              number: true,
              status: true,
              destination: true,
              totalCents: true,
              createdAt: true,
              trackingCode: true,
            },
          });
          if (orders.length === 0) return "Esta pessoa ainda não fez pedidos.";
          return JSON.stringify(
            orders.map((o) => ({
              numero: o.number,
              tipo: o.destination === "SHELTER" ? "doação" : "compra",
              situacao:
                o.destination === "SHELTER" && o.status === "DELIVERED"
                  ? "Entregue ao abrigo"
                  : orderStatusLabels[o.status],
              total: formatBRL(o.totalCents),
              data: o.createdAt.toISOString().slice(0, 10),
              rastreio: o.trackingCode,
              link: `/pedidos/${o.number}`,
            })),
          );
        },
      }),
    );
  }
  return list;
}

export class LyaUnavailableError extends Error {}

// Responde à conversa. O histórico chega do navegador já validado (rota /api/lya).
export async function askLya(history: LyaMessage[], user: LyaUser) {
  if (!process.env.ANTHROPIC_API_KEY) throw new LyaUnavailableError("ANTHROPIC_API_KEY ausente");
  const client = new Anthropic();

  const context = user
    ? `A pessoa está logada e se chama ${user.name.split(" ")[0]}. Pode usar ver_meus_pedidos para os pedidos dela.`
    : "A pessoa não está logada. Para ver pedidos, ela precisa entrar na conta em /entrar.";

  const final = await client.beta.messages.toolRunner({
    model: MODEL,
    max_tokens: 4000,
    // Chat: respostas curtas e rápidas.
    output_config: { effort: "low" },
    // Se o modelo recusar por engano, o próprio servidor tenta de novo com o modelo indicado.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    cache_control: { type: "ephemeral" },
    system: SYSTEM,
    tools: tools(user),
    max_iterations: 5,
    messages: [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "system" as const, content: context },
    ],
  });

  if (final.stop_reason === "refusal") {
    return "Desculpe, não consigo ajudar com isso por aqui. Posso te ajudar com a loja, a adoção ou as doações?";
  }
  const text = final.content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
  return text || "Hmm, não consegui responder agora. Pode tentar de novo?";
}
