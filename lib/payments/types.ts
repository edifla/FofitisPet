// Contrato com o gateway de pagamento (KAN-26). Hoje há só o gateway simulado; o Mercado Pago
// entra na KAN-55 implementando esta mesma interface.

export type GatewayStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";

export type PixCharge = {
  providerPaymentId: string;
  // Código "copia e cola". O gateway real também devolve a imagem do QR Code.
  qrCode: string;
};

// Dados do cartão como chegam ao gateway. No simulado vêm do formulário; no Mercado Pago (KAN-55)
// o navegador troca o cartão por um token e o número nunca passa pelo nosso servidor.
export type CardData = {
  number: string;
  holderName: string;
  expiry: string;
  cvv: string;
};

export type CardCharge = {
  providerPaymentId: string;
  status: GatewayStatus;
  statusDetail: string;
};

export interface PaymentGateway {
  // Nome gravado em Payment.provider e usado para casar os webhooks.
  readonly name: string;
  createPix(input: {
    reference: string;
    amountCents: number;
    payerEmail: string;
    expiresAt: Date;
  }): Promise<PixCharge>;
  // Cobrança no cartão: o gateway responde na hora se aprovou ou recusou.
  createCardPayment(input: {
    reference: string;
    amountCents: number;
    payerEmail: string;
    installments: number;
    card: CardData;
  }): Promise<CardCharge>;
}

// Erro de dados que o cliente pode corrigir (ex.: cartão que o gateway não aceita).
export class GatewayInputError extends Error {}

// Atualização de um pagamento vinda do gateway (webhook). eventId identifica o aviso, para o
// mesmo aviso não ser processado duas vezes.
export type GatewayUpdate = {
  provider: string;
  eventId: string;
  type: string;
  providerPaymentId: string;
  status: GatewayStatus;
  statusDetail?: string | null;
  payload: unknown;
};
