import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccountCard } from "@/components/account/account-card";
import { DeleteButton } from "@/components/admin/delete-button";
import { buttonClasses } from "@/components/ui/button";
import { MapPinIcon, PencilIcon, PlusIcon } from "@/components/ui/icons";
import { Notice } from "@/components/ui/notice";
import { listAddresses } from "@/lib/addresses";
import { requireUser } from "@/lib/dal";
import { formatZipCode } from "@/lib/validation/address";
import { deleteAddress } from "../profile-actions";
import { MakeDefaultButton } from "./address-actions";
import { AccountAddressForm } from "./address-form";

export const metadata: Metadata = {
  title: "Endereços",
  robots: { index: false },
};

type Props = PageProps<"/conta/enderecos">;

// Aba "Endereços": os endereços salvos para a entrega, com o padrão em destaque.
export default function AddressesPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
      <Addresses searchParams={searchParams} />
    </Suspense>
  );
}

async function Addresses({ searchParams }: Pick<Props, "searchParams">) {
  const user = await requireUser("/conta/enderecos");
  const params = await searchParams;
  const addresses = await listAddresses(user.id);
  const adding = params.novo === "1" || addresses.length === 0;

  return (
    <div className="flex flex-col gap-6">
      {params.salvo === "1" && (
        <Notice tone="success" role="status">
          Endereço salvo.
        </Notice>
      )}

      {addresses.length > 0 && (
        <AccountCard
          title="Endereços salvos"
          description="O endereço padrão já vem escolhido no checkout."
          action={
            !adding && (
              <Link href="/conta/enderecos?novo=1" className={buttonClasses({ size: "sm" })}>
                <PlusIcon className="size-4" />
                Novo endereço
              </Link>
            )
          }
        >
          <ul className="grid gap-4 md:grid-cols-2">
            {addresses.map((address) => (
              <li
                key={address.id}
                className={
                  address.isDefault
                    ? "flex flex-col gap-3 rounded-2xl bg-brand-50/60 p-4 ring-2 ring-brand-200 dark:bg-brand-950 dark:ring-brand-800"
                    : "flex flex-col gap-3 rounded-2xl p-4 ring-1 ring-zinc-200 dark:ring-zinc-800"
                }
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface text-brand-700 shadow-sm dark:text-brand-300">
                    <MapPinIcon className="size-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      {address.label ?? "Endereço"}
                      {address.isDefault && (
                        <span className="rounded-full bg-brand-700 px-2 py-0.5 text-xs font-semibold text-white dark:bg-brand-400 dark:text-brand-950">
                          Padrão
                        </span>
                      )}
                    </p>
                    <p className="text-zinc-700 dark:text-zinc-300">{address.recipientName}</p>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {address.street}, {address.number}
                      {address.complement && ` — ${address.complement}`}
                      <br />
                      {address.neighborhood}, {address.city} - {address.state}
                      <br />
                      CEP {formatZipCode(address.zipCode)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1 border-t border-zinc-200/70 pt-2 dark:border-zinc-800">
                  <Link
                    href={`/conta/enderecos/${address.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-brand-text hover:bg-brand-50 dark:hover:bg-brand-900/40"
                  >
                    <PencilIcon className="size-4" />
                    Editar<span className="sr-only"> {address.label ?? "endereço"}</span>
                  </Link>
                  {!address.isDefault && <MakeDefaultButton addressId={address.id} />}
                  <span className="ml-auto">
                    <DeleteButton
                      appearance="button"
                      action={deleteAddress.bind(null, address.id)}
                      confirmMessage={`Excluir o endereço "${address.label ?? address.street}"? Os pedidos já feitos não mudam.`}
                    />
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </AccountCard>
      )}

      {adding && (
        <AccountCard
          title="Novo endereço"
          description={
            addresses.length === 0
              ? "Você ainda não tem endereços salvos. O primeiro vira o padrão."
              : undefined
          }
        >
          <AccountAddressForm addressId={null} initial={{}} isDefault={addresses.length === 0} />
        </AccountCard>
      )}
    </div>
  );
}
