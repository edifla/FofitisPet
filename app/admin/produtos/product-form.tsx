"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  CheckboxField,
  CheckboxGroup,
  Field,
  FormMessage,
  SelectField,
  SubmitButton,
  TextAreaField,
} from "@/components/form/field";
import { speciesOptions } from "@/lib/labels";
import { saveProduct } from "../actions";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  brandId: string | null;
  species: string[];
  donationEligible: boolean;
  active: boolean;
};

type Option = { id: string; name: string };

export function ProductForm({
  product,
  categories,
  brands,
}: {
  product?: Product;
  categories: Option[];
  brands: Option[];
}) {
  const [state, action, pending] = useActionState(
    saveProduct.bind(null, product?.id ?? null),
    undefined,
  );
  const value = (name: "name" | "slug" | "description" | "categoryId" | "brandId") => {
    const typed = state?.values?.[name];
    if (typed !== undefined) return String(typed);
    return product?.[name] ?? "";
  };
  const species = (state?.values?.species as string[] | undefined) ?? product?.species ?? [];

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-4" noValidate>
      <Field
        label="Nome"
        name="name"
        required
        defaultValue={value("name")}
        errors={state?.errors?.name}
      />
      <Field
        label="Slug"
        name="slug"
        defaultValue={value("slug")}
        hint="Parte do endereço da página do produto. Deixe em branco para gerar a partir do nome."
        errors={state?.errors?.slug}
      />
      <TextAreaField
        label="Descrição"
        name="description"
        required
        defaultValue={value("description")}
        errors={state?.errors?.description}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Categoria"
          name="categoryId"
          required
          placeholder="Escolha uma categoria"
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          defaultValue={value("categoryId")}
          errors={state?.errors?.categoryId}
        />
        <SelectField
          label="Marca"
          name="brandId"
          placeholder="Sem marca"
          options={brands.map((b) => ({ value: b.id, label: b.name }))}
          defaultValue={value("brandId")}
          errors={state?.errors?.brandId}
        />
      </div>
      <CheckboxGroup
        legend="Para quais espécies"
        name="species"
        options={speciesOptions}
        defaultValues={species}
        errors={state?.errors?.species}
      />
      <CheckboxField
        label="Pode ser comprado para o abrigo"
        name="donationEligible"
        defaultChecked={product?.donationEligible ?? false}
        hint='Mostra a opção "Doar este item" na loja (KAN-30).'
      />
      <CheckboxField
        label="Ativo na loja"
        name="active"
        defaultChecked={product?.active ?? true}
        hint="Produtos inativos não aparecem para os clientes."
      />
      <p className="text-sm text-zinc-500">
        Preço, peso e estoque ficam nas variações do produto, cadastradas depois de salvar.
      </p>
      <FormMessage message={state?.message} />
      <div className="flex items-center gap-4">
        <SubmitButton pending={pending}>
          {product ? "Salvar alterações" : "Criar produto"}
        </SubmitButton>
        <Link href="/admin/produtos" className="text-sm underline">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
