import "server-only";
import { PDFDocument, type PDFFont, type PDFPage, rgb, StandardFonts } from "pdf-lib";
import { formatAge } from "@/lib/adoption";
import {
  animalSexLabels,
  animalSizeLabels,
  animalSpeciesLabels,
  housingTypeLabels,
} from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { formatPhone } from "@/lib/validation/adoption";

// Termo de adoção em PDF (KAN-41), preenchido com os dados do adotante e do animal. CPF, RG e
// endereço completo não são pedidos no formulário: ficam em branco para preencher à mão na
// entrega, junto com as assinaturas. As cláusulas são provisórias até os textos legais (KAN-14).

const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" });
const shortDate = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" });

const CLAUSES = [
  "Oferecer ao animal alimentação adequada, água limpa, abrigo contra sol e chuva, espaço compatível com o porte e atenção diária.",
  "Manter as vacinas e a vermifugação em dia e levar o animal ao veterinário sempre que necessário.",
  "Castrar o animal, caso ainda não seja castrado, na idade indicada pelo veterinário.",
  "Não abandonar, vender, doar ou repassar o animal a terceiros. Se não puder mais ficar com ele, devolvê-lo ao abrigo.",
  "Não manter o animal acorrentado ou preso em espaço pequeno, e não usá-lo para guarda, reprodução ou fins comerciais.",
  "Permitir que o abrigo acompanhe a adaptação por contato ou visita combinada nos primeiros meses.",
  "Avisar o abrigo em caso de mudança de endereço ou telefone, perda, fuga ou morte do animal.",
  "Estar ciente de que maus-tratos a animais são crime (Lei 9.605/1998, art. 32) e de que o descumprimento deste termo permite ao abrigo pedir a devolução do animal.",
];

export async function getTermData(requestId: string) {
  return prisma.adoptionRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      status: true,
      decidedAt: true,
      applicantName: true,
      applicantEmail: true,
      applicantPhone: true,
      applicantCity: true,
      applicantState: true,
      housingType: true,
      animal: {
        select: {
          name: true,
          slug: true,
          species: true,
          sex: true,
          size: true,
          birthDate: true,
          neutered: true,
          dewormed: true,
          vaccinations: {
            orderBy: { appliedAt: "asc" },
            select: { name: true, appliedAt: true },
          },
        },
      },
    },
  });
}

type TermData = NonNullable<Awaited<ReturnType<typeof getTermData>>>;

// Escreve texto com quebra de linha automática, criando páginas novas quando precisa.
class Writer {
  private page: PDFPage;
  private y: number;
  constructor(
    private doc: PDFDocument,
    private fonts: { regular: PDFFont; bold: PDFFont },
  ) {
    this.page = doc.addPage([595.28, 841.89]);
    this.y = this.top;
  }
  private readonly margin = 56;
  private readonly top = 841.89 - 56;
  private get width() {
    return 595.28 - this.margin * 2;
  }

  private ensure(height: number) {
    if (this.y - height < this.margin) {
      this.page = this.doc.addPage([595.28, 841.89]);
      this.y = this.top;
    }
  }

  text(content: string, { size = 10, bold = false, indent = 0, gap = 4 } = {}) {
    const font = bold ? this.fonts.bold : this.fonts.regular;
    const lines: string[] = [];
    let line = "";
    for (const word of content.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > this.width - indent && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
    for (const l of lines) {
      this.ensure(size * 1.4);
      this.y -= size * 1.4;
      this.page.drawText(l, { x: this.margin + indent, y: this.y, size, font });
    }
    this.y -= gap;
  }

  space(height: number) {
    this.y -= height;
  }

  signature(label: string) {
    this.ensure(50);
    this.y -= 36;
    this.page.drawLine({
      start: { x: this.margin, y: this.y },
      end: { x: this.margin + 260, y: this.y },
      thickness: 0.7,
      color: rgb(0, 0, 0),
    });
    this.y -= 12;
    this.page.drawText(label, { x: this.margin, y: this.y, size: 9, font: this.fonts.regular });
  }
}

export async function buildAdoptionTerm(data: TermData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Termo de adoção - ${data.animal.name}`);
  doc.setAuthor("FofitisPet");
  const fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
  const w = new Writer(doc, fonts);
  const { animal } = data;
  const female = animal.sex === "FEMALE";

  w.text("TERMO DE ADOÇÃO RESPONSÁVEL", { size: 15, bold: true, gap: 2 });
  w.text("Abrigo FofitisPet", { size: 10, gap: 14 });

  w.text("Adotante", { size: 12, bold: true });
  w.text(`Nome: ${data.applicantName}`);
  w.text(`E-mail: ${data.applicantEmail}    Telefone: ${formatPhone(data.applicantPhone)}`);
  w.text(
    `Cidade: ${data.applicantCity}/${data.applicantState}    Moradia: ${housingTypeLabels[data.housingType]}`,
  );
  w.text("CPF: ______________________________    RG: ______________________________");
  w.text(
    "Endereço completo: ____________________________________________________________________",
    { gap: 12 },
  );

  w.text("Animal", { size: 12, bold: true });
  w.text(`Nome: ${animal.name}`);
  w.text(
    `${animalSpeciesLabels[animal.species]} · ${animalSexLabels[animal.sex]} · Porte ${animalSizeLabels[animal.size].toLowerCase()} · ${formatAge(animal.birthDate)}`,
  );
  w.text(
    `${animal.neutered ? (female ? "Castrada" : "Castrado") : female ? "Não castrada" : "Não castrado"} · ${animal.dewormed ? (female ? "Vermifugada" : "Vermifugado") : "Vermifugação pendente"}`,
  );
  w.text(
    animal.vaccinations.length
      ? `Vacinas: ${animal.vaccinations.map((v) => `${v.name} (${shortDate.format(v.appliedAt)})`).join(", ")}`
      : "Vacinas: nenhuma registrada até a data deste termo.",
    { gap: 12 },
  );

  w.text("Compromissos do adotante", { size: 12, bold: true });
  w.text(
    `Ao adotar ${animal.name}, o adotante assume a guarda e a responsabilidade pelo animal e se compromete a:`,
    { gap: 6 },
  );
  CLAUSES.forEach((clause, index) => w.text(`${index + 1}. ${clause}`, { indent: 8 }));
  w.space(8);
  w.text(
    `Adoção aprovada pelo abrigo em ${data.decidedAt ? date.format(data.decidedAt) : "—"}. Solicitação nº ${data.id}.`,
    { size: 9 },
  );
  w.text("Local e data: ________________________________________", { gap: 8 });

  w.signature(`Adotante: ${data.applicantName}`);
  w.signature("Responsável pelo Abrigo FofitisPet");

  return doc.save();
}
