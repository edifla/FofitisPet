"use client";

import { useId, useState } from "react";
import { cn } from "@/components/ui/cn";
import { formatTick, formatValue, type ChartFormat, type ChartTone } from "./format";

export type { ChartFormat, ChartTone } from "./format";

// Gráfico de uma série ao longo dos dias, em SVG puro: área (linha de 2px com uma leve aguada) ou
// colunas. Passe o mouse (ou use as setas do teclado) para ver o valor de cada dia; a mesma
// informação fica numa tabela logo abaixo, para quem não enxerga o gráfico.

export type ChartPoint = { label: string; value: number };
const tones: Record<ChartTone, string> = {
  brand: "text-brand-600 dark:text-brand-400",
  donate: "text-donate-500 dark:text-donate-400",
  adopt: "text-adopt-600 dark:text-adopt-400",
};

// Topo do eixo arredondado (1, 2, 2,5 ou 5 × 10ⁿ), para os valores das linhas de grade.
function niceMax(max: number) {
  if (max <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * power >= max) ?? 10;
  return step * power;
}

const W = 600;
const H = 200;

export function TimeChart({
  title,
  data,
  format = "number",
  tone = "brand",
  kind = "area",
}: {
  title: string;
  data: ChartPoint[];
  format?: ChartFormat;
  tone?: ChartTone;
  kind?: "area" | "columns";
}) {
  const [active, setActive] = useState<number | null>(null);
  const tableId = useId();
  const n = data.length;
  // Escala mínima (R$ 10 ou 2 unidades), para o eixo não repetir "0" num período sem movimento.
  const max = niceMax(Math.max(format === "brl" ? 1000 : 2, ...data.map((d) => d.value)));
  const ticks = [0, 0.5, 1].map((f) => f * max);
  const allZero = data.every((d) => d.value === 0);

  // Posição horizontal (0 a 1) do ponto i: nas colunas, o centro de cada faixa.
  const xAt = (i: number) => (kind === "columns" ? (i + 0.5) / n : n === 1 ? 0.5 : i / (n - 1));
  const yAt = (v: number) => 1 - v / max;

  const line = data.map((d, i) => `${i ? "L" : "M"}${xAt(i) * W},${yAt(d.value) * H}`).join(" ");
  const area = `${line} L${xAt(n - 1) * W},${H} L${xAt(0) * W},${H} Z`;
  const band = W / n;
  const barWidth = Math.min(24, Math.max(2, band - 2));

  function pick(clientX: number, rect: DOMRect) {
    const f = (clientX - rect.left) / rect.width;
    const i = kind === "columns" ? Math.floor(f * n) : Math.round(f * (n - 1));
    setActive(Math.min(n - 1, Math.max(0, i)));
  }

  const point = active === null ? null : data[active];
  const labelEvery = Math.ceil(n / 6);

  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="sr-only">{title}</figcaption>
      <div className="flex gap-3">
        {/* Eixo vertical: valores das linhas de grade. */}
        <div
          aria-hidden
          className="relative h-48 w-14 shrink-0 text-right text-xs text-zinc-500 tabular-nums"
        >
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-0 -translate-y-1/2"
              style={{ top: `${yAt(t) * 100}%` }}
            >
              {formatTick(t, format)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          <div
            role="img"
            aria-label={`${title}. Use as setas para ver cada dia; os valores também estão na tabela.`}
            aria-describedby={tableId}
            tabIndex={0}
            className={cn(
              "relative h-48 cursor-crosshair rounded-md outline-offset-4",
              tones[tone],
            )}
            onPointerMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
            onPointerLeave={() => setActive(null)}
            onBlur={() => setActive(null)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                const step = e.key === "ArrowRight" ? 1 : -1;
                setActive((i) => Math.min(n - 1, Math.max(0, (i ?? (step > 0 ? -1 : n)) + step)));
              }
            }}
          >
            <svg
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              className="absolute inset-0 size-full overflow-visible"
              aria-hidden
            >
              {ticks.map((t) => (
                <line
                  key={t}
                  x1={0}
                  x2={W}
                  y1={yAt(t) * H}
                  y2={yAt(t) * H}
                  className="stroke-zinc-200 dark:stroke-zinc-800"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {kind === "area" ? (
                <>
                  <path d={area} fill="currentColor" fillOpacity={0.1} />
                  <path
                    d={line}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </>
              ) : (
                data.map((d, i) => {
                  const h = (d.value / max) * H;
                  const x = xAt(i) * W - barWidth / 2;
                  const r = Math.min(4, h, barWidth / 2);
                  // Coluna com a ponta arredondada e a base reta.
                  const path =
                    h <= 0
                      ? ""
                      : `M${x},${H} V${H - h + r} Q${x},${H - h} ${x + r},${H - h} H${x + barWidth - r} Q${x + barWidth},${H - h} ${x + barWidth},${H - h + r} V${H} Z`;
                  return (
                    <path
                      key={d.label}
                      d={path}
                      fill="currentColor"
                      opacity={active === null || active === i ? 1 : 0.45}
                    />
                  );
                })
              )}
            </svg>

            {allZero && (
              <p className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
                Nenhum movimento no período.
              </p>
            )}

            {point && active !== null && (
              <>
                {kind === "area" && (
                  <>
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 w-px bg-zinc-400/70"
                      style={{ left: `${xAt(active) * 100}%` }}
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current ring-2 ring-surface"
                      style={{ left: `${xAt(active) * 100}%`, top: `${yAt(point.value) * 100}%` }}
                    />
                  </>
                )}
                <div
                  role="status"
                  className="pointer-events-none absolute top-0 z-10 flex -translate-x-1/2 flex-col rounded-lg bg-surface px-3 py-2 text-xs whitespace-nowrap shadow-lg ring-1 ring-zinc-200 dark:ring-zinc-700"
                  style={{ left: `${Math.min(88, Math.max(12, xAt(active) * 100))}%` }}
                >
                  <span className="text-sm font-semibold text-foreground">
                    {formatValue(point.value, format)}
                  </span>
                  <span className="text-zinc-500">{point.label}</span>
                </div>
              </>
            )}
          </div>

          {/* Datas no eixo horizontal, espaçadas para não se atropelarem. */}
          <div aria-hidden className="relative mt-2 h-4 text-xs text-zinc-500">
            {data.map((d, i) =>
              i % labelEvery === 0 || i === n - 1 ? (
                <span
                  key={d.label}
                  className="absolute -translate-x-1/2 whitespace-nowrap"
                  style={{ left: `${xAt(i) * 100}%` }}
                >
                  {d.label}
                </span>
              ) : null,
            )}
          </div>
        </div>
      </div>

      <details className="text-sm">
        <summary className="w-fit cursor-pointer text-zinc-500 hover:text-foreground">
          Ver em tabela
        </summary>
        <table id={tableId} className="mt-2 w-full max-w-sm text-left">
          <caption className="sr-only">{title}</caption>
          <thead className="text-xs text-zinc-500">
            <tr>
              <th className="py-1 font-medium">Dia</th>
              <th className="py-1 text-right font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="py-1">{d.label}</td>
                <td className="py-1 text-right tabular-nums">{formatValue(d.value, format)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
