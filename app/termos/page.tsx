import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import { DONATION_NOTICE, LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: "Regras de uso da loja, da compra para o abrigo e da adoção da FofitisPet.",
};

// Termos de uso (KAN-14). Rascunho: revisar com advogado antes do lançamento.
export default function TermsPage() {
  return (
    <LegalPage title="Termos de uso">
      <p>
        Estes termos valem para o uso do site da {LEGAL.companyName}: a loja de produtos para pets,
        a compra de produtos para o abrigo e a adoção de animais. Ao criar uma conta ou fazer um
        pedido, você concorda com eles e com a{" "}
        <Link href="/privacidade" className="underline">
          política de privacidade
        </Link>
        .
      </p>

      <h2>1. Conta</h2>
      <p>
        Para comprar, doar ou acompanhar pedidos é preciso ter 18 anos ou mais e criar uma conta com
        dados verdadeiros. Você é responsável por manter a senha em sigilo. Podemos suspender contas
        usadas para fraude ou abuso.
      </p>

      <h2>2. Produtos, preços e estoque</h2>
      <p>
        Os preços e a disponibilidade podem mudar sem aviso, mas o valor confirmado no checkout é o
        que vale para o seu pedido. O estoque é reservado quando o pedido é criado e liberado se o
        pagamento não for feito dentro do prazo mostrado.
      </p>

      <h2>3. Pagamento e entrega</h2>
      <p>
        O pagamento é feito por Pix ou cartão, por meio de um processador de pagamento. O pedido só
        é preparado depois da aprovação. Prazos e valores de frete aparecem antes da confirmação.
      </p>

      <h2>4. Arrependimento, trocas e devoluções</h2>
      <p>
        Em compras pela internet você pode desistir em até 7 dias depois de receber o produto
        (Código de Defesa do Consumidor, art. 49), com devolução do valor pago. Produtos com defeito
        seguem as regras de garantia do mesmo código. Para isso, fale com{" "}
        <a href={`mailto:${LEGAL.contactEmail}`} className="underline">
          {LEGAL.contactEmail}
        </a>
        .
      </p>

      <h2>5. Compra para o abrigo (doação)</h2>
      <p>
        Na doação você compra produtos da loja que são entregues direto ao estoque do abrigo da{" "}
        {LEGAL.companyName}, sem frete. O uso dos itens é mostrado na{" "}
        <Link href="/transparencia" className="underline">
          página de transparência
        </Link>
        . {DONATION_NOTICE} Como os itens chegam ao abrigo logo após o pagamento, pedidos de
        cancelamento são analisados caso a caso pelo contato acima.
      </p>

      <h2>6. Adoção</h2>
      <p>
        Enviar o formulário de interesse não garante a adoção. O abrigo avalia cada solicitação,
        pode marcar uma conversa ou visita e decide de acordo com o bem-estar do animal. A adoção é
        gratuita e só se completa com a assinatura do{" "}
        <Link href="/termo-de-adocao" className="underline">
          termo de adoção responsável
        </Link>
        .
      </p>

      <h2>7. Uso do site</h2>
      <p>
        Não é permitido usar o site para fraudes, tentar acessar áreas restritas, sobrecarregar o
        serviço ou copiar o conteúdo (textos, fotos e marca) sem autorização.
      </p>

      <h2>8. Responsabilidade</h2>
      <p>
        Fazemos o possível para manter o site no ar e as informações corretas, mas podem ocorrer
        interrupções e erros. Nada nestes termos limita os seus direitos como consumidor.
      </p>

      <h2>9. Mudanças e foro</h2>
      <p>
        Podemos atualizar estes termos; a data no topo mostra a versão em vigor. Vale a lei
        brasileira, e eventuais disputas podem ser levadas ao foro do seu domicílio.
      </p>
    </LegalPage>
  );
}
