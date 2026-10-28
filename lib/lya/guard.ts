// Dados que a Lya nunca deve receber (KAN-127): número de cartão e CPF. A mensagem que tiver um
// deles não vai para o modelo, não é guardada e a Lya responde com um aviso fixo.

export type SensitiveKind = "cartao" | "cpf";

// Algoritmo de Luhn: o dígito verificador de todo número de cartão.
function luhn(digits: string) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

// Os dois dígitos verificadores do CPF; sequências repetidas (111.111.111-11) não valem.
function validCpf(digits: string) {
  if (/^(\d)\1{10}$/.test(digits)) return false;
  const check = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(digits[i]) * (length + 1 - i);
    const rest = (sum * 10) % 11;
    return (rest === 10 ? 0 : rest) === Number(digits[length]);
  };
  return check(9) && check(10);
}

export function detectSensitive(text: string): SensitiveKind | null {
  // Sequências de 11 a 19 dígitos, aceitando espaço, ponto e traço no meio.
  for (const match of text.matchAll(/\d(?:[ .-]?\d){10,18}/g)) {
    const digits = match[0].replace(/\D/g, "");
    if (digits.length >= 13 && luhn(digits)) return "cartao";
    if (digits.length === 11 && validCpf(digits)) return "cpf";
  }
  return null;
}

// Esconde os números sensíveis de um texto (para mostrar a mensagem sem eles).
export function maskSensitive(text: string) {
  return text.replace(/\d(?:[ .-]?\d){10,18}/g, (match) => {
    const digits = match.replace(/\D/g, "");
    const isCard = digits.length >= 13 && luhn(digits);
    const isCpf = digits.length === 11 && validCpf(digits);
    return isCard || isCpf ? "[número removido]" : match;
  });
}

export const SENSITIVE_REPLY: Record<SensitiveKind, string> = {
  cartao:
    "Opa! Parece que a sua mensagem tem um número de cartão. Por segurança, eu não leio nem guardo dados de cartão, e ninguém da FofitisPet vai pedir isso por aqui. Os pagamentos são feitos só na tela de pagamento do pedido. Pode me mandar a sua dúvida de novo sem o número?",
  cpf: "Opa! Parece que a sua mensagem tem um CPF. Por segurança, eu não leio nem guardo documentos. Pode me mandar a sua dúvida de novo sem ele?",
};
