import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import { ADOPTION_TERM_CLAUSES, LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Termo de adoção responsável",
  description: "Os compromissos de quem adota um animal do abrigo da FofitisPet.",
};

// Versão pública do termo de adoção (KAN-14). O PDF assinado na entrega (KAN-41) usa as mesmas
// cláusulas, preenchidas com os dados do adotante e do animal.
export default function AdoptionTermPage() {
  return (
    <LegalPage title="Termo de adoção responsável">
      <p>
        Antes de enviar o interesse, conheça os compromissos que você assume ao adotar um animal do
        abrigo da {LEGAL.companyName}. Na entrega, o termo é impresso com os seus dados e os do
        animal e assinado pelos dois lados. CPF, RG e endereço completo são preenchidos só nesse
        momento.
      </p>
      <p>Quem adota se compromete a:</p>
      <ol className="flex flex-col gap-2">
        {ADOPTION_TERM_CLAUSES.map((clause) => (
          <li key={clause}>{clause}</li>
        ))}
      </ol>
      <p>
        <Link href="/adocao" className="underline">
          Conheça os animais para adoção
        </Link>
      </p>
    </LegalPage>
  );
}
