import { LEGAL, legalVersionLabel } from "@/lib/legal";

// Moldura das páginas legais (KAN-14): título, data da versão e aviso de rascunho.
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-zinc-500">Última atualização: {legalVersionLabel()}</p>
        {LEGAL.draft && (
          <p
            role="note"
            className="rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200"
          >
            Versão provisória, em revisão jurídica. Os dados da empresa serão completados com a
            abertura do CNPJ.
          </p>
        )}
      </header>
      <div className="flex flex-col gap-4 leading-relaxed text-zinc-800 dark:text-zinc-200 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ol>li]:list-decimal">
        {children}
      </div>
    </main>
  );
}
