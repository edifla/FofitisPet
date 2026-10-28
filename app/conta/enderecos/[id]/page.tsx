import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccountCard } from "@/components/account/account-card";
import { getUserAddress } from "@/lib/addresses";
import { requireUser } from "@/lib/dal";
import { formatZipCode } from "@/lib/validation/address";
import { AccountAddressForm } from "../address-form";

export const metadata: Metadata = {
  title: "Editar endereço",
  robots: { index: false },
};

type Props = PageProps<"/conta/enderecos/[id]">;

export default function EditAddressPage({ params }: Props) {
  return (
    <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
      <EditAddress params={params} />
    </Suspense>
  );
}

async function EditAddress({ params }: Pick<Props, "params">) {
  const user = await requireUser("/conta/enderecos");
  const { id } = await params;
  // Só os endereços da própria pessoa: o de outra pessoa aparece como inexistente.
  const address = await getUserAddress(user.id, id);
  if (!address) notFound();
  return (
    <AccountCard title="Editar endereço">
      <AccountAddressForm
        addressId={address.id}
        isDefault={address.isDefault}
        initial={{
          recipientName: address.recipientName,
          zipCode: formatZipCode(address.zipCode),
          street: address.street,
          number: address.number,
          complement: address.complement ?? "",
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          label: address.label ?? "",
        }}
      />
    </AccountCard>
  );
}
