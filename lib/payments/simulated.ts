import "server-only";
import { randomUUID } from "node:crypto";
import type { PaymentGateway } from "./types";

// Gateway simulado: não fala com nenhum provedor. Gera identificadores e códigos de mentira no
// mesmo formato que um gateway real, para o checkout e os pedidos funcionarem de ponta a ponta.
export const SIMULATED_PROVIDER = "simulado";

export const simulatedGateway: PaymentGateway = {
  name: SIMULATED_PROVIDER,

  async createPix({ reference, amountCents }) {
    const providerPaymentId = `sim_pix_${randomUUID()}`;
    const amount = (amountCents / 100).toFixed(2);
    // Parecido com um "copia e cola" de verdade, mas sem chave Pix válida: não paga nada.
    const qrCode = [
      "00020126580014BR.GOV.BCB.PIX0136SIMULADO-FOFITISPET-NAO-PAGAR",
      `5204000053039865406${amount.padStart(6, "0")}`,
      `5802BR5911FOFITISPET6009SAO PAULO62${String(reference.length + 4).padStart(2, "0")}05${String(reference.length).padStart(2, "0")}${reference}`,
      "6304SIMU",
    ].join("");
    return { providerPaymentId, qrCode };
  },
};
