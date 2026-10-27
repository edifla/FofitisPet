import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { listAddresses } from "@/lib/addresses";
import { getCart } from "@/lib/cart";
import { requireUser } from "@/lib/dal";
import { formatZipCode } from "@/lib/validation/address";
import { AddressForm } from "./address-form";
import { buttonClasses } from "@/components/ui/button";
import { containerClasses } from "@/components/ui/layout";

export const metadata: Metadata = {
  title: "Endereço de entrega",
  robots: { index: false },
};

// Passo 1 do checkout (KAN-105): escolher ou cadastrar o endereço de entrega.
export default function CheckoutAddressPage() {
  return (
    <main className={containerClasses("text")}>
      <p className="text-sm text-zinc-500">Checkout · passo 1 de 2</p>
      <h1 className="mb-6 text-2xl font-semibold">Endereço de entrega</h1>
      <Suspense fallback={<p className="text-zinc-500">Carregando...</p>}>
        <AddressStep />
      </Suspense>
    </main>
  );
}

async function AddressStep() {
  const user = await requireUser("/checkout");
  const [addresses, cart] = await Promise.all([listAddresses(user.id), getCart()]);

  if (cart.purchaseCount === 0) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p>Seu carrinho está vazio ou sem itens disponíveis.</p>
        <Link href="/carrinho" className="font-medium underline">
          Voltar ao carrinho
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {addresses.length > 0 && (
        <form action="/checkout/resumo" className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 font-medium">Seus endereços</legend>
            {addresses.map((address, index) => (
              <label
                key={address.id}
                className="flex cursor-pointer gap-3 rounded-md border border-zinc-300 p-4 has-checked:border-zinc-900 dark:border-zinc-700 dark:has-checked:border-zinc-100"
              >
                <input
                  type="radio"
                  name="endereco"
                  value={address.id}
                  defaultChecked={index === 0}
                  className="mt-1"
                />
                <span className="text-sm">
                  <span className="font-medium">
                    {address.label ?? address.recipientName}
                    {address.isDefault && <span className="ml-2 text-zinc-500">(padrão)</span>}
                  </span>
                  <span className="block">
                    {address.street}, {address.number}
                    {address.complement && ` · ${address.complement}`}
                  </span>
                  <span className="block text-zinc-500">
                    {address.neighborhood} · {address.city}/{address.state} · CEP{" "}
                    {formatZipCode(address.zipCode)}
                  </span>
                  {address.label && (
                    <span className="block text-zinc-500">Para: {address.recipientName}</span>
                  )}
                </span>
              </label>
            ))}
          </fieldset>
          <div>
            <button type="submit" className={buttonClasses()}>
              Entregar neste endereço
            </button>
          </div>
        </form>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="font-medium">
          {addresses.length > 0 ? "Ou cadastre um novo endereço" : "Para onde vamos entregar?"}
        </h2>
        <AddressForm hasAddresses={addresses.length > 0} />
      </section>
    </div>
  );
}
