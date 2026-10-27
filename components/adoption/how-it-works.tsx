// Como funciona a adoção, em 4 passos (mesmo fluxo do formulário e do admin, KAN-39 a 41).
const STEPS = [
  { title: "Conheça", text: "Veja os animais, a história e o jeito de cada um." },
  { title: "Conte sobre você", text: "Preencha o formulário de interesse em poucos minutos." },
  { title: "Vamos conversar", text: "A equipe do abrigo entra em contato e combina uma visita." },
  { title: "Novo lar", text: "Com tudo certo, vocês assinam o termo e ele vai para casa." },
];

export function HowItWorks({ compact = false }: { compact?: boolean }) {
  return (
    <ol
      className={compact ? "grid gap-3 sm:grid-cols-2" : "grid gap-4 sm:grid-cols-2 lg:grid-cols-4"}
    >
      {STEPS.map((step, index) => (
        <li key={step.title} className="flex gap-3">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-adopt-700 font-display font-extrabold text-white dark:bg-adopt-400 dark:text-adopt-950"
          >
            {index + 1}
          </span>
          <div>
            <h3 className="font-semibold">{step.title}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
