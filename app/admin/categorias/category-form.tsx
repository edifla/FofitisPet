"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  Field,
  FormMessage,
  SelectField,
  SubmitButton,
  TextAreaField,
} from "@/components/form/field";
import { saveCategory } from "../actions";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  position: number;
};

export function CategoryForm({
  category,
  parents,
}: {
  category?: Category;
  parents: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(
    saveCategory.bind(null, category?.id ?? null),
    undefined,
  );
  const value = (name: keyof Category) => {
    const typed = state?.values?.[name];
    if (typed !== undefined) return String(typed);
    const saved = category?.[name];
    return saved === null || saved === undefined ? "" : String(saved);
  };

  return (
    <form action={action} className="flex max-w-xl flex-col gap-4" noValidate>
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
        hint="Parte do endereço da página. Deixe em branco para gerar a partir do nome."
        errors={state?.errors?.slug}
      />
      <SelectField
        label="Categoria pai"
        name="parentId"
        placeholder="Nenhuma (categoria principal)"
        options={parents
          .filter((p) => p.id !== category?.id)
          .map((p) => ({ value: p.id, label: p.name }))}
        defaultValue={value("parentId")}
        errors={state?.errors?.parentId}
      />
      <TextAreaField
        label="Descrição"
        name="description"
        rows={3}
        defaultValue={value("description")}
        errors={state?.errors?.description}
      />
      <Field
        label="Ordem"
        name="position"
        type="number"
        min={0}
        defaultValue={value("position") || "0"}
        hint="Categorias com número menor aparecem primeiro."
        errors={state?.errors?.position}
      />
      <FormMessage message={state?.message} />
      <div className="flex items-center gap-4">
        <SubmitButton pending={pending}>
          {category ? "Salvar alterações" : "Criar categoria"}
        </SubmitButton>
        <Link href="/admin/categorias" className="text-sm underline">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
