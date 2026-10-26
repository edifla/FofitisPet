import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getAdoptionRequest } from "@/lib/admin/adoptions";
import { ADOPTION_TRANSITIONS, adoptionStatusLabels } from "@/lib/adoption-flow";
import { animalStatusLabels, housingTypeLabels } from "@/lib/labels";
import { formatPhone } from "@/lib/validation/adoption";
import { NotesForm, StatusForm } from "./forms";

export const metadata: Metadata = { title: "Solicitação de adoção" };

type Props = PageProps<"/admin/adocoes/[id]">;

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

const yes = (value: boolean) => (value ? "Sim" : "Não");

// Detalhe da solicitação, mudança de status e histórico (KAN-116).
export default function AdoptionRequestPage({ params }: Props) {
  return (
    <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
      <RequestDetails params={params} />
    </Suspense>
  );
}

async function RequestDetails({ params }: Pick<Props, "params">) {
  const request = await getAdoptionRequest((await params).id);
  if (!request) notFound();
  const next = ADOPTION_TRANSITIONS[request.status];

  const answers: [string, React.ReactNode][] = [
    [
      "E-mail",
      <a key="e" href={`mailto:${request.applicantEmail}`} className="underline">
        {request.applicantEmail}
      </a>,
    ],
    ["Telefone", formatPhone(request.applicantPhone)],
    ["Cidade", `${request.applicantCity}/${request.applicantState}`],
    ["Conta na loja", request.user ? request.user.email : "Enviado sem login"],
    ["Moradia", housingTypeLabels[request.housingType]],
    ["Moradia própria", yes(request.ownsHome)],
    ["Quintal ou área externa", yes(request.hasYard)],
    ["Todos na casa concordam", yes(request.householdAgrees)],
    ["Outros animais", request.hasOtherPets ? request.otherPetsDescription : "Não"],
  ];

  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="Você está em" className="text-sm text-zinc-500">
        <Link href="/admin/adocoes" className="underline">
          Solicitações de adoção
        </Link>
        {" / "}
        {request.applicantName}
      </nav>

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">
          {request.applicantName} quer adotar {request.animal.name}
        </h1>
        <p className="text-sm text-zinc-500">
          Recebida em {dateTime.format(request.createdAt)} · Status:{" "}
          <strong className="text-zinc-900 dark:text-zinc-100">
            {adoptionStatusLabels[request.status]}
          </strong>
          {request.status === "INTERVIEW" && request.interviewAt && (
            <> · Entrevista em {dateTime.format(request.interviewAt)}</>
          )}
        </p>
        <p className="text-sm text-zinc-500">
          Animal:{" "}
          <Link href={`/admin/animais/${request.animal.id}`} className="underline">
            {request.animal.name}
          </Link>{" "}
          ({animalStatusLabels[request.animal.status]})
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="mb-2 font-medium">Respostas</h2>
            <dl className="grid grid-cols-[12rem_1fr] gap-x-4 gap-y-1 text-sm">
              {answers.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-zinc-500">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section>
            <h2 className="mb-1 font-medium">Experiência com animais</h2>
            <p className="text-sm whitespace-pre-line">{request.experience}</p>
          </section>
          <section>
            <h2 className="mb-1 font-medium">Por que quer adotar</h2>
            <p className="text-sm whitespace-pre-line">{request.reason}</p>
          </section>
          <section>
            <h2 className="mb-2 font-medium">Histórico</h2>
            <ol className="flex flex-col gap-2 text-sm">
              {request.events.map((event) => (
                <li key={event.id} className="border-l-2 border-zinc-300 pl-3 dark:border-zinc-700">
                  <span className="text-zinc-500">{dateTime.format(event.createdAt)}</span>{" "}
                  {event.fromStatus
                    ? `${adoptionStatusLabels[event.fromStatus]} → ${adoptionStatusLabels[event.toStatus]}`
                    : "Formulário recebido"}
                  {" · "}
                  <span className="text-zinc-500">{event.createdBy?.name ?? "Sistema"}</span>
                  {event.note && <p className="whitespace-pre-line">{event.note}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="flex flex-col gap-8">
          <section>
            <h2 className="mb-2 font-medium">Mudar status</h2>
            {next.length > 0 ? (
              // Remonta ao mudar o status, para recomeçar com as novas opções.
              <StatusForm
                key={request.status}
                requestId={request.id}
                options={next.map((s) => ({ value: s, label: adoptionStatusLabels[s] }))}
              />
            ) : (
              <p className="text-sm text-zinc-500">Solicitação encerrada.</p>
            )}
          </section>
          <section>
            <h2 className="mb-2 font-medium">Anotações internas</h2>
            <NotesForm requestId={request.id} notes={request.adminNotes ?? ""} />
          </section>
        </aside>
      </div>
    </div>
  );
}
