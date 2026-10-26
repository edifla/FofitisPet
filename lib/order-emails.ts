import "server-only";
import { appUrl, sendEmail } from "@/lib/email";
import { formatBRL } from "@/lib/money";
import { prisma } from "@/lib/prisma";

// E-mails transacionais dos pedidos (KAN-28). Saem depois que a mudança foi gravada, e uma falha
// no envio nunca desfaz o pedido nem o pagamento: só fica no log.

type OrderEmailKind = "created" | "paid" | "canceled" | "shipped" | "delivered";

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export async function sendOrderEmail(orderId: string, kind: OrderEmailKind) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        number: true,
        destination: true,
        createdAt: true,
        totalCents: true,
        cancelReason: true,
        trackingCode: true,
        user: { select: { name: true, email: true } },
        items: {
          orderBy: { productName: "asc" },
          select: { productName: true, variantName: true, quantity: true, totalCents: true },
        },
      },
    });
    if (!order) return;

    const donation = order.destination === "SHELTER";
    const link = appUrl(`/pedidos/${order.number}`);
    const items = order.items.map(
      (item) =>
        `- ${item.quantity}x ${item.productName} (${item.variantName}): ${formatBRL(item.totalCents)}`,
    );
    const summary = [...items, `Total: ${formatBRL(order.totalCents)}`];

    const content: Record<OrderEmailKind, { subject: string; body: string[] }> = {
      created: {
        subject: `Recebemos seu pedido #${order.number}`,
        body: [
          `Recebemos seu pedido em ${dateTime.format(order.createdAt)} e os itens estão reservados.`,
          "Pague com Pix ou cartão em até 60 minutos para confirmar:",
          link,
          "",
          ...summary,
        ],
      },
      paid: {
        subject: donation
          ? `Obrigado pela doação! Pedido #${order.number}`
          : `Pagamento aprovado: pedido #${order.number}`,
        body: donation
          ? [
              "Seu pagamento foi aprovado e os itens já foram entregues ao estoque do abrigo.",
              "Muito obrigado por ajudar os nossos animais!",
              "",
              ...summary,
              "",
              link,
            ]
          : [
              "Seu pagamento foi aprovado. Já estamos separando o seu pedido.",
              "",
              ...summary,
              "",
              `Acompanhe por aqui: ${link}`,
            ],
      },
      canceled: {
        subject: `Pedido #${order.number} cancelado`,
        body: [
          `Seu pedido foi cancelado${order.cancelReason ? `: ${order.cancelReason.toLowerCase()}` : ""}.`,
          "Os itens voltaram para a loja e nenhum valor foi cobrado.",
          "Se ainda quiser os produtos, é só fazer um novo pedido.",
          "",
          link,
        ],
      },
      shipped: {
        subject: `Pedido #${order.number} enviado`,
        body: [
          "Seu pedido saiu para entrega.",
          ...(order.trackingCode ? [`Código de rastreio: ${order.trackingCode}`] : []),
          "",
          link,
        ],
      },
      delivered: {
        subject: `Pedido #${order.number} entregue`,
        body: ["Seu pedido foi entregue. Esperamos que o seu pet goste!", "", link],
      },
    };

    const { subject, body } = content[kind];
    await sendEmail({
      to: order.user.email,
      subject,
      text: [`Olá, ${order.user.name}!`, "", ...body, "", "Equipe FofitisPet"].join("\n"),
    });
  } catch (error) {
    console.error(`Falha ao enviar o e-mail "${kind}" do pedido ${orderId}:`, error);
  }
}
