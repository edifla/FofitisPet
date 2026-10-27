import type { Metadata } from "next";
import { Suspense } from "react";
import { PawIcon } from "@/components/brand/logo";
import {
  CheckboxField,
  Field,
  RadioGroup,
  SelectField,
  TextAreaField,
} from "@/components/form/field";
import { Badge, Tag } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { gridClasses, PageHeader } from "@/components/ui/layout";
import { Notice } from "@/components/ui/notice";
import { requireAdmin } from "@/lib/dal";

export const metadata: Metadata = { title: "Design system", robots: { index: false } };

// Vitrine do design system (KAN-17): cada componente com as variações, para conferir e copiar.
// Os componentes ficam em components/ui e components/form; as cores em app/globals.css.
export default function DesignSystemPage() {
  return (
    <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
      <Showcase />
    </Suspense>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

const swatches = [
  ["brand-50", "bg-brand-50"],
  ["brand-100", "bg-brand-100"],
  ["brand-300", "bg-brand-300"],
  ["brand-400", "bg-brand-400"],
  ["brand-500", "bg-brand-500"],
  ["brand-600", "bg-brand-600"],
  ["brand-700 (primary)", "bg-brand-700"],
  ["brand-800", "bg-brand-800"],
  ["donate-700 (doação, coral)", "bg-donate-700"],
] as const;

async function Showcase() {
  await requireAdmin();
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Design system"
        description="Componentes reutilizáveis, mobile first, com as cores e fontes dos tokens da identidade visual (KAN-15)."
      />

      <Section title="Cores">
        <ul className={gridClasses("stats")}>
          {swatches.map(([name, bg]) => (
            <li key={name} className="flex items-center gap-3 text-sm">
              <span
                className={`size-10 rounded-md border border-zinc-200 dark:border-zinc-800 ${bg}`}
              />
              {name}
            </li>
          ))}
        </ul>
        <p className="flex items-center gap-2 text-brand-text">
          <PawIcon className="size-5" /> Texto e ícones da marca (brand-text)
        </p>
      </Section>

      <Section title="Botões">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Principal</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="donate">Doar ao abrigo</Button>
          <Button variant="danger">Excluir</Button>
          <Button disabled>Desativado</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Pequeno</Button>
          <Button>Médio</Button>
          <Button size="lg">Grande</Button>
          <ButtonLink href="/produtos" variant="secondary">
            Link com cara de botão
          </ButtonLink>
        </div>
        <div className="max-w-sm">
          <Button block>Largura toda (celular)</Button>
        </div>
      </Section>

      <Section title="Selos e etiquetas">
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="donate">Doável ao abrigo</Badge>
          <Badge tone="warning">Reservado</Badge>
          <Badge>Esgotado</Badge>
          <Tag>Carinhoso</Tag>
          <Tag>Se dá bem com crianças</Tag>
        </div>
      </Section>

      <Section title="Avisos">
        <div className={gridClasses("halves")}>
          <Notice tone="info">Informação neutra.</Notice>
          <Notice tone="warning">Atenção: este animal já tem uma adoção em andamento.</Notice>
          <Notice tone="success">Recebemos seu interesse!</Notice>
          <Notice tone="danger">Pagamento recusado.</Notice>
        </div>
      </Section>

      <Section title="Cards e grade">
        <ul className={gridClasses("compact")}>
          <li>
            <Card>
              <h3 className="font-semibold">Card padrão</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Moldura para kits, itens do abrigo e resumos.
              </p>
            </Card>
          </li>
          <li>
            <Card tone="donate">
              <h3 className="font-semibold">Card de doação</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Campanhas e kits.</p>
              <Button variant="donate" size="sm" className="self-start">
                Doar
              </Button>
            </Card>
          </li>
          <li>
            <Card>
              <h3 className="font-semibold">Grade</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Uma coluna no celular, duas a partir de 640 px e três a partir de 1024 px.
              </p>
            </Card>
          </li>
        </ul>
        <p className="text-sm text-zinc-500">
          Cards de produto e animal: components/catalog/product-card.tsx e
          components/adoption/animal-card.tsx.
        </p>
      </Section>

      <Section title="Formulários">
        <form className="grid max-w-2xl gap-4 sm:grid-cols-2" noValidate>
          <Field label="Nome" name="exemplo-nome" placeholder="Ana Souza" />
          <Field
            label="E-mail"
            name="exemplo-email"
            type="email"
            defaultValue="ana@"
            errors={["Informe um e-mail válido."]}
          />
          <SelectField
            label="Porte"
            name="exemplo-porte"
            placeholder="Escolha"
            options={[
              { value: "p", label: "Pequeno" },
              { value: "m", label: "Médio" },
            ]}
          />
          <TextAreaField
            label="Observação"
            name="exemplo-obs"
            rows={2}
            hint="Dica embaixo do campo."
          />
          <RadioGroup
            legend="Tem quintal?"
            name="exemplo-quintal"
            options={[
              { value: "sim", label: "Sim" },
              { value: "nao", label: "Não" },
            ]}
          />
          <CheckboxField label="Aceito os termos" name="exemplo-termos" />
        </form>
      </Section>
    </div>
  );
}
