import "server-only";
import { SIMULATED_PROVIDER, simulatedGateway } from "./simulated";
import type { PaymentGateway } from "./types";

export type { GatewayStatus, GatewayUpdate, PaymentGateway } from "./types";
export { GatewayInputError } from "./types";

// Pagamentos simulados não podem ser aceitos em produção por engano: só com
// ALLOW_SIMULATED_PAYMENTS=true (ex.: um ambiente de demonstração).
export function simulatedPaymentsAllowed() {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_SIMULATED_PAYMENTS === "true";
}

// Se a loja está usando o gateway simulado (mostra os cartões de teste, por exemplo).
export function usingSimulatedGateway() {
  return (
    (process.env.PAYMENT_PROVIDER ?? SIMULATED_PROVIDER) === SIMULATED_PROVIDER &&
    simulatedPaymentsAllowed()
  );
}

// Ponto único de troca do gateway (KAN-55: Mercado Pago).
export function getGateway(): PaymentGateway {
  const provider = process.env.PAYMENT_PROVIDER ?? SIMULATED_PROVIDER;
  if (provider === SIMULATED_PROVIDER) {
    if (!simulatedPaymentsAllowed()) {
      throw new Error("Gateway simulado desativado em produção. Configure PAYMENT_PROVIDER.");
    }
    return simulatedGateway;
  }
  throw new Error(`Gateway de pagamento desconhecido: ${provider}`);
}
