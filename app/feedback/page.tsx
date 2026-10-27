import type { Metadata } from "next";
import { Suspense } from "react";
import { containerClasses, PageHeader } from "@/components/ui/layout";
import { getCurrentUser } from "@/lib/dal";
import { FeedbackForm } from "./feedback-form";

export const metadata: Metadata = { title: "Enviar feedback", robots: { index: false } };

type Props = PageProps<"/feedback">;

// Feedback do beta (KAN-52): qualquer pessoa pode comentar um problema ou sugestão.
export default function FeedbackPage({ searchParams }: Props) {
  return (
    <main className={containerClasses("narrow", "flex flex-col gap-6")}>
      <PageHeader
        title="Enviar feedback"
        description="Estamos testando o site com poucas pessoas. Achou um problema, ficou com dúvida ou tem uma ideia? Conte aqui."
      />
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <Form searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Form({ searchParams }: Pick<Props, "searchParams">) {
  const de = (await searchParams).de;
  const from = typeof de === "string" && de.startsWith("/") ? de.slice(0, 300) : "";
  const user = await getCurrentUser();
  return <FeedbackForm from={from} loggedIn={Boolean(user)} />;
}
