import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

// Campos de formulário com rótulo e mensagens de erro. Estilo provisório até o design system (KAN-17).

const controlClass =
  "rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900 aria-invalid:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100";

type LabeledProps = {
  label: string;
  name: string;
  errors?: string[];
  hint?: string;
};

function FieldShell({
  label,
  name,
  errors,
  hint,
  children,
}: LabeledProps & {
  children: (a11y: { "aria-invalid"?: true; "aria-describedby"?: string }) => React.ReactNode;
}) {
  const errorId = errors?.length ? `${name}-error` : undefined;
  const hintId = hint ? `${name}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      {children({
        "aria-invalid": errorId ? true : undefined,
        "aria-describedby": [hintId, errorId].filter(Boolean).join(" ") || undefined,
      })}
      {hint && (
        <p id={hintId} className="text-sm text-zinc-500">
          {hint}
        </p>
      )}
      {errorId && (
        <ul id={errorId} className="text-sm text-red-600">
          {errors!.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Field({
  label,
  name,
  errors,
  hint,
  ...inputProps
}: LabeledProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell label={label} name={name} errors={errors} hint={hint}>
      {(a11y) => <input id={name} name={name} className={controlClass} {...a11y} {...inputProps} />}
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  name,
  errors,
  hint,
  ...props
}: LabeledProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell label={label} name={name} errors={errors} hint={hint}>
      {(a11y) => (
        <textarea id={name} name={name} rows={5} className={controlClass} {...a11y} {...props} />
      )}
    </FieldShell>
  );
}

export function SelectField({
  label,
  name,
  errors,
  hint,
  options,
  placeholder,
  ...props
}: LabeledProps &
  SelectHTMLAttributes<HTMLSelectElement> & {
    options: { value: string; label: string }[];
    placeholder?: string;
  }) {
  return (
    <FieldShell label={label} name={name} errors={errors} hint={hint}>
      {(a11y) => (
        <select id={name} name={name} className={controlClass} {...a11y} {...props}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}

export function CheckboxField({
  label,
  name,
  hint,
  ...props
}: Omit<LabeledProps, "errors"> & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name={name} className="size-4" {...props} />
        {label}
      </label>
      {hint && <p className="ml-6 text-sm text-zinc-500">{hint}</p>}
    </div>
  );
}

// Grupo de caixas de seleção com o mesmo name (ex.: espécies do produto).
export function CheckboxGroup({
  legend,
  name,
  options,
  defaultValues = [],
  errors,
}: {
  legend: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValues?: string[];
  errors?: string[];
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name={name}
              value={option.value}
              defaultChecked={defaultValues.includes(option.value)}
              className="size-4"
            />
            {option.label}
          </label>
        ))}
      </div>
      {errors?.length ? <p className="text-sm text-red-600">{errors.join(" ")}</p> : null}
    </fieldset>
  );
}

export function FormMessage({
  message,
  tone = "error",
}: {
  message?: string;
  tone?: "error" | "success";
}) {
  if (!message) return null;
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={tone === "error" ? "text-sm text-red-600" : "text-sm text-green-700"}
    >
      {message}
    </p>
  );
}

export function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-primary px-4 py-2 font-medium text-on-primary hover:bg-primary-hover disabled:opacity-60"
    >
      {pending ? "Aguarde..." : children}
    </button>
  );
}
