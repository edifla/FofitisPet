// Contrato com o gateway de pagamento (KAN-26). Hoje há só o gateway simulado; o Mercado Pago
// entra na KAN-55 implementando esta mesma interface.

export type GatewayStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";

export type PixCharge = {
  providerPaymentId: string;
  // Código "copia e cola". O gateway real também devolve a imagem do QR Code.
  qrCode: string;
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
}

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
