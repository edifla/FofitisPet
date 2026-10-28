import { LEGAL } from "@/lib/legal";

// Informações do abrigo para quem quer levar doações (aba Doar). Preencha o endereço e os horários
// quando estiverem definidos; enquanto isso, a página pede para combinar pelo e-mail.
export const SHELTER_INFO = {
  // Ex.: "Rua das Flores, 123, Jardim Primavera, São Paulo - SP".
  address: null as string | null,
  // Ex.: "Segunda a sábado, das 9h às 17h".
  hours: null as string | null,
  contactEmail: LEGAL.contactEmail,
};

// O que o abrigo aceita e o que não dá para receber. Ajuste conforme a necessidade do abrigo.
export const ACCEPTED_ITEMS = [
  { title: "Ração e petiscos", detail: "Pacotes fechados e dentro da validade." },
  { title: "Cobertores e toalhas", detail: "Limpos, mesmo que usados." },
  { title: "Caminhas e casinhas", detail: "Em bom estado." },
  { title: "Coleiras, guias e potes", detail: "Novos ou em bom estado." },
  { title: "Brinquedos", detail: "Resistentes e sem peças pequenas soltas." },
  { title: "Produtos de limpeza", detail: "Desinfetante, sabão, sacos de lixo." },
];

export const NOT_ACCEPTED = [
  "Ração ou petisco aberto, vencido ou a granel",
  "Remédios, mesmo dentro da validade (só com orientação do veterinário do abrigo)",
  "Comida de gente",
];
