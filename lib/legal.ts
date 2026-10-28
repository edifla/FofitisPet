// Textos legais da FofitisPet (KAN-14). RASCUNHO: precisam de revisão jurídica antes do
// lançamento, e os dados da empresa dependem da abertura do MEI (KAN-13) e do domínio (KAN-54).

export const LEGAL = {
  // Enquanto for true, as páginas legais mostram o aviso de rascunho.
  draft: true,
  // Data da versão em vigor. Ao mudar um texto, atualize; o consentimento guarda a versão (KAN-124).
  version: "2026-10-29",
  companyName: "FofitisPet",
  // Preenchidos com a abertura do MEI (KAN-13).
  cnpj: "a definir",
  city: "a definir",
  // Endereço provisório até o domínio e o e-mail transacional (KAN-54).
  contactEmail: "contato@fofitispet.com.br",
} as const;

// Aviso sobre a natureza da doação (KAN-14): mostrado em /doar, no checkout da doação e no
// comprovante.
export const DONATION_NOTICE =
  "A doação é uma compra de produtos entregues ao abrigo da FofitisPet. Ela não é dedutível do " +
  "Imposto de Renda e o comprovante não tem valor fiscal: a FofitisPet não é uma entidade " +
  "beneficente certificada.";

// Compromissos do adotante, usados na página pública do termo e no PDF (KAN-41).
export const ADOPTION_TERM_CLAUSES = [
  "Oferecer ao animal alimentação adequada, água limpa, abrigo contra sol e chuva, espaço compatível com o porte e atenção diária.",
  "Manter as vacinas e a vermifugação em dia e levar o animal ao veterinário sempre que necessário.",
  "Castrar o animal, caso ainda não seja castrado, na idade indicada pelo veterinário.",
  "Não abandonar, vender, doar ou repassar o animal a terceiros. Se não puder mais ficar com ele, devolvê-lo ao abrigo.",
  "Não manter o animal acorrentado ou preso em espaço pequeno, e não usá-lo para guarda, reprodução ou fins comerciais.",
  "Permitir que o abrigo acompanhe a adaptação por contato ou visita combinada nos primeiros meses.",
  "Avisar o abrigo em caso de mudança de endereço ou telefone, perda, fuga ou morte do animal.",
  "Estar ciente de que maus-tratos a animais são crime (Lei 9.605/1998, art. 32) e de que o descumprimento deste termo permite ao abrigo pedir a devolução do animal.",
] as const;

// "27 de outubro de 2026".
export function legalVersionLabel() {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${LEGAL.version}T00:00:00Z`),
  );
}
