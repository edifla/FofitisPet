import "server-only";

type Email = {
  to: string;
  subject: string;
  text: string;
};

// Ainda não há serviço de e-mail transacional (KAN-54, Épico 8). Enquanto isso, o e-mail é
// escrito no log do servidor para dar para testar os fluxos em desenvolvimento.
export async function sendEmail({ to, subject, text }: Email): Promise<void> {
  console.info(
    [
      "",
      "──── e-mail (sem envio real até a KAN-54) ────",
      `Para: ${to}`,
      `Assunto: ${subject}`,
      "",
      text,
      "────────────────────────────────────────────",
      "",
    ].join("\n"),
  );
}

export function appUrl(path: string): string {
  return new URL(path, process.env.APP_URL ?? "http://localhost:3000").toString();
}
