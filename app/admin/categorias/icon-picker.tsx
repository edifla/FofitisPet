import { CategoryIconGlyph } from "@/components/catalog/category-icon";
import { CATEGORY_ICON_KEYS, CATEGORY_ICONS } from "@/lib/category-icons";

const tile =
  "flex cursor-pointer flex-col items-center gap-1 rounded-xl px-1 py-2 text-center text-xs ring-1 ring-zinc-200 transition hover:bg-brand-50 has-checked:bg-brand-700 has-checked:text-white has-checked:ring-brand-700 has-focus-visible:ring-2 has-focus-visible:ring-brand-600 dark:ring-zinc-700 dark:hover:bg-brand-900/30 dark:has-checked:bg-brand-400 dark:has-checked:text-brand-950";

// Escolha do ícone da categoria no filtro da loja. "Automático" deixa a loja escolher pelo nome.
export function IconPicker({ value, errors }: { value: string; errors?: string[] }) {
  return (
    <fieldset className="flex flex-col gap-2" aria-describedby="icone-dica">
      <legend className="mb-1 text-sm font-medium">Ícone no filtro da loja</legend>
      <p id="icone-dica" className="-mt-1 text-sm text-zinc-500">
        Aparece na lista de categorias da loja. Em &quot;Automático&quot;, o ícone é escolhido pelo
        nome da categoria.
      </p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        <label className={tile}>
          <input type="radio" name="icon" value="" defaultChecked={!value} className="sr-only" />
          <span aria-hidden className="flex size-6 items-center justify-center text-base font-bold">
            A
          </span>
          Automático
        </label>
        {CATEGORY_ICON_KEYS.map((key) => (
          <label key={key} className={tile} title={CATEGORY_ICONS[key]}>
            <input
              type="radio"
              name="icon"
              value={key}
              defaultChecked={value === key}
              className="sr-only"
            />
            <CategoryIconGlyph icon={key} className="size-6" />
            <span className="leading-tight">{CATEGORY_ICONS[key].split(" (")[0]}</span>
          </label>
        ))}
      </div>
      {errors?.map((error) => (
        <p key={error} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ))}
    </fieldset>
  );
}
