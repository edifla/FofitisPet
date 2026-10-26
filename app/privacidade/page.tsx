import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Como a FofitisPet coleta, usa e protege os seus dados pessoais (LGPD).",
};

// Política de privacidade (KAN-14, publicada na KAN-125). Descreve o que o site realmente guarda;
// ao mudar o tratamento de dados, atualize este texto e LEGAL.version.
export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidade">
      <p>
        Esta política explica quais dados pessoais a {LEGAL.companyName} coleta na loja, na compra
        para o abrigo e na adoção, para que usa, com quem compartilha e como você exerce seus
        direitos, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018, LGPD).
      </p>

      <h2>1. Quem é o controlador</h2>
      <p>
        {LEGAL.companyName}, CNPJ {LEGAL.cnpj}. Contato do encarregado de dados:{" "}
        <a href={`mailto:${LEGAL.contactEmail}`} className="underline">
          {LEGAL.contactEmail}
        </a>
        .
      </p>

      <h2>2. Dados que coletamos</h2>
      <ul>
        <li>
          <strong>Conta:</strong> nome, e-mail e senha. A senha é guardada só de forma cifrada
          (hash); ninguém da equipe consegue lê-la.
        </li>
        <li>
          <strong>Endereços de entrega</strong> que você cadastra.
        </li>
        <li>
          <strong>Pedidos e doações:</strong> itens, valores, datas e situação. Do cartão de crédito
          guardamos só a bandeira, os 4 últimos dígitos e o número de parcelas; o número completo e
          o código de segurança vão direto ao processador de pagamento e não ficam conosco.
        </li>
        <li>
          <strong>Formulário de interesse em adoção:</strong> nome, e-mail, telefone, cidade, tipo
          de moradia, se há outros animais, sua experiência e o motivo da adoção, além das anotações
          da equipe do abrigo sobre a solicitação.
        </li>
        <li>
          <strong>Dados técnicos:</strong> endereço IP usado por pouco tempo para limitar tentativas
          de login e de pagamento (proteção contra abuso), registros de erros do servidor e
          contagens anônimas de páginas visitadas, sem identificar você.
        </li>
      </ul>

      <h2>3. Para que usamos e com qual base legal</h2>
      <ul>
        <li>
          Processar compras, doações, pagamentos e entregas, e enviar e-mails sobre eles: execução
          de contrato (art. 7º, V).
        </li>
        <li>
          Avaliar a sua solicitação de adoção e entrar em contato: consentimento, dado no próprio
          formulário (art. 7º, I).
        </li>
        <li>
          Proteger o site contra fraudes e abusos, corrigir erros e entender o uso de forma anônima:
          legítimo interesse (art. 7º, IX).
        </li>
        <li>
          Guardar registros de vendas exigidos pela legislação fiscal: obrigação legal (art. 7º,
          II).
        </li>
      </ul>
      <p>Não vendemos seus dados e não usamos seus dados para publicidade.</p>

      <h2>4. Página de transparência</h2>
      <p>
        Na{" "}
        <Link href="/transparencia" className="underline">
          página de transparência
        </Link>
        , doações entregues aparecem com o primeiro nome e a inicial do sobrenome do doador (ex.:
        &quot;Carla S.&quot;) e os itens doados, nunca o valor pago por pessoa. Se marcar a doação
        como anônima no checkout, seu nome não aparece.
      </p>

      <h2>5. Com quem compartilhamos</h2>
      <ul>
        <li>Processador de pagamento, para cobrar compras e doações.</li>
        <li>Transportadora, com nome e endereço de entrega, para enviar compras.</li>
        <li>Provedores de hospedagem, banco de dados e envio de e-mails, que operam o site.</li>
        <li>Autoridades, quando a lei exigir.</li>
      </ul>

      <h2>6. Cookies</h2>
      <p>
        Usamos só cookies necessários: o de sessão, que mantém você conectado, e o do carrinho, que
        guarda os itens por até 60 dias. Não usamos cookies de publicidade nem de rastreamento entre
        sites; por isso não pedimos aceite de cookies.
      </p>

      <h2>7. Por quanto tempo guardamos</h2>
      <ul>
        <li>Conta e endereços: enquanto a conta existir.</li>
        <li>
          Pedidos e doações: 5 anos após a compra, pela legislação fiscal. Se você excluir a conta,
          eles ficam sem o seu nome e e-mail.
        </li>
        <li>Solicitações de adoção: até 2 anos após a decisão, para o histórico do abrigo.</li>
        <li>Contadores de tentativas por IP: minutos ou horas.</li>
      </ul>

      <h2>8. Seus direitos</h2>
      <p>
        Você pode pedir confirmação e acesso aos seus dados, correção, anonimização ou exclusão,
        portabilidade, informação sobre compartilhamento e revogar o consentimento (art. 18). Em{" "}
        <Link href="/conta" className="underline">
          Minha conta
        </Link>{" "}
        você baixa uma cópia dos seus dados e pode excluir a conta. Para o resto, escreva para{" "}
        <a href={`mailto:${LEGAL.contactEmail}`} className="underline">
          {LEGAL.contactEmail}
        </a>
        ; respondemos em até 15 dias. Você também pode reclamar à Autoridade Nacional de Proteção de
        Dados (ANPD).
      </p>

      <h2>9. Segurança</h2>
      <p>
        Usamos conexão cifrada, senhas com hash, acesso restrito ao painel administrativo e limite
        de tentativas. Se houver um incidente que possa trazer risco a você, avisaremos você e a
        ANPD.
      </p>

      <h2>10. Menores de idade</h2>
      <p>
        Compras, doações e adoções são para maiores de 18 anos. Não coletamos de propósito dados de
        crianças.
      </p>

      <h2>11. Mudanças nesta política</h2>
      <p>
        Quando esta política mudar, a data no topo é atualizada e avisaremos mudanças importantes
        por e-mail.
      </p>
    </LegalPage>
  );
}
