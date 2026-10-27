import Link from "next/link";
import { daysLeft, getActiveCampaigns } from "@/lib/campaigns";
import { speciesSlugs } from "@/lib/catalog-params";
import { formatFoodTotal } from "@/lib/food";
import { buttonClasses } from "@/components/ui/button";
import { cardClasses } from "@/components/ui/card";
import { gridClasses } from "@/components/ui/layout";

// Campanhas de ração no ar, com barra de progresso (KAN-42). Componente de servidor: quem usa
// precisa estar dentro de um <Suspense>.
export async function CampaignList({
  heading = "Campanhas",
  empty,
}: {
  heading?: string;
  empty?: React.ReactNode;
}) {
  const campaigns = await getActiveCampaigns();
  if (campaigns.length === 0) return empty ?? null;

  return (
    <section className="flex flex-col gap-4" aria-labelledby="campanhas">
      <h2 id="campanhas" className="text-lg font-semibold">
        {heading}
      </h2>
      <ul className={gridClasses("halves")}>
        {campaigns.map((campaign) => {
          const { raisedGrams, donations, percent } = campaign.progress;
          const left = daysLeft(campaign.endsAt);
          const speciesSlug = Object.keys(speciesSlugs).find(
            (slug) => speciesSlugs[slug] === campaign.species,
          );
          const donateHref = `/produtos?${new URLSearchParams({
            doacao: "sim",
            categoria: "alimentacao",
            ...(speciesSlug && { especie: speciesSlug }),
          })}`;
          return (
            <li key={campaign.id} className={cardClasses({ tone: "donate" })}>
              <div>
                <h3 className="font-semibold">{campaign.title}</h3>
                <p className="text-sm whitespace-pre-line text-zinc-600 dark:text-zinc-400">
                  {campaign.description}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <div
                  className="h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
                  role="progressbar"
                  aria-label={`Progresso da campanha ${campaign.title}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent}
                  aria-valuetext={`${formatFoodTotal(raisedGrams)} de ${formatFoodTotal(campaign.goalGrams)}`}
                >
                  <div className="h-full bg-donate-600" style={{ width: `${percent}%` }} />
                </div>
                <p className="text-sm">
                  <strong>{formatFoodTotal(raisedGrams)}</strong> de{" "}
                  {formatFoodTotal(campaign.goalGrams)} · {percent}%
                  {percent >= 100 && " · Meta alcançada!"}
                </p>
                <p className="text-sm text-zinc-500">
                  {donations === 1 ? "1 doação" : `${donations} doações`}
                  {left !== null && ` · ${left === 1 ? "último dia" : `faltam ${left} dias`}`}
                </p>
              </div>
              <Link
                href={donateHref}
                className={buttonClasses({
                  variant: "donate",
                  size: "sm",
                  className: "self-start",
                })}
              >
                Doar ração
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
