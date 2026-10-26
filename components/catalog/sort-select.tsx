"use client";

import { catalogSorts, type CatalogSort } from "@/lib/catalog-params";

// Com JavaScript, muda a ordem ao escolher a opção; sem, o botão "Ordenar" envia o formulário.
export function SortSelect({ value }: { value: CatalogSort }) {
  return (
    <>
      <label htmlFor="ordem" className="text-sm text-zinc-500">
        Ordenar por
      </label>
      <select
        id="ordem"
        name="ordem"
        defaultValue={value}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        {Object.entries(catalogSorts).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className="text-sm underline">
          Ordenar
        </button>
      </noscript>
    </>
  );
}
