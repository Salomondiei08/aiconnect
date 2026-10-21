"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatValue, niceMax, useMeasure, type ValueFormat } from "./chart-utils";

export type BarDatum = { label: string; value: number; hint?: string };

/**
 * Barres horizontales classées : top produits, répartition par entreprise.
 * Chaque barre se déploie à l'apparition avec un léger décalage, et une infobulle suit le survol.
 */
export function BarList({
  data,
  valueFormat = "compact",
  color = "var(--chart-1)",
  className,
  max: maxOverride,
}: {
  data: BarDatum[];
  valueFormat?: ValueFormat;
  color?: string;
  className?: string;
  max?: number;
}) {
  const max = maxOverride ?? niceMax(Math.max(...data.map((d) => d.value), 1));

  return (
    <ul className={cn("space-y-3", className)}>
      {data.map((d, i) => {
        const pct = max ? Math.max(2, (d.value / max) * 100) : 0;
        return (
          <li key={d.label} className="group/bar">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-medium" title={d.hint ?? d.label}>
                {d.label}
              </span>
              <span className="tabular shrink-0 font-semibold">{formatValue(valueFormat, d.value)}</span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-sunken">
              <div
                className="h-full rounded-full animate-grow-width group-hover/bar:brightness-110"
                style={{
                  width: `${pct}%`,
                  ["--bar-w" as string]: `${pct}%`,
                  animationDelay: `${i * 55}ms`,
                  background: `linear-gradient(90deg, color-mix(in oklab, ${color} 62%, var(--surface)), ${color})`,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const PAD = { top: 12, right: 8, bottom: 26, left: 40 };

/** Histogramme vertical (ventes par jour) avec infobulle au survol. */
export function ColumnChart({
  data,
  height = 200,
  valueFormat = "compact",
  color = "var(--chart-1)",
  className,
  ariaLabel,
}: {
  data: { label: string; value: number }[];
  height?: number;
  valueFormat?: ValueFormat;
  color?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const [ref, width] = useMeasure<HTMLDivElement>();
  const [hover, setHover] = React.useState<number | null>(null);
  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = Math.max(0, height - PAD.top - PAD.bottom);
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const slot = data.length ? innerW / data.length : innerW;
  const barW = Math.max(4, Math.min(28, slot * 0.62));
  const active = hover != null ? data[hover] : null;

  return (
    <div ref={ref} className={cn("relative w-full", className)}>
      {width ? (
        <svg width={width} height={height} role="img" aria-label={ariaLabel ?? "Histogramme"} onMouseLeave={() => setHover(null)}>
          {[0, 0.5, 1].map((t) => {
            const y = PAD.top + innerH * t;
            return (
              <g key={t}>
                <line x1={PAD.left} x2={PAD.left + innerW} y1={y} y2={y} stroke="var(--line)" strokeDasharray={t === 1 ? undefined : "3 5"} />
                <text x={PAD.left - 8} y={y + 4} textAnchor="end" className="fill-[var(--muted)] text-[10px] tabular">
                  {formatValue(valueFormat, max * (1 - t))}
                </text>
              </g>
            );
          })}
          {data.map((d, i) => {
            const h = max ? (d.value / max) * innerH : 0;
            const x = PAD.left + i * slot + (slot - barW) / 2;
            const y = PAD.top + innerH - h;
            return (
              <g key={i} onMouseEnter={() => setHover(i)}>
                <rect x={PAD.left + i * slot} y={PAD.top} width={slot} height={innerH} fill="transparent" />
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={Math.max(h, d.value > 0 ? 2 : 0)}
                  rx={Math.min(5, barW / 2)}
                  fill={color}
                  opacity={hover == null || hover === i ? 1 : 0.45}
                  className="bar-origin animate-grow-bar transition-opacity"
                  style={{ animationDelay: `${i * 28}ms` }}
                />
              </g>
            );
          })}
          {data.map((d, i) =>
            data.length > 16 && i % Math.ceil(data.length / 8) !== 0 && i !== data.length - 1 ? null : (
              <text key={`l-${i}`} x={PAD.left + i * slot + slot / 2} y={height - 6} textAnchor="middle" className="fill-[var(--muted)] text-[10px]">
                {d.label}
              </text>
            ),
          )}
        </svg>
      ) : (
        <div style={{ height }} className="skeleton w-full" />
      )}
      {active && hover != null ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-[var(--shadow-md)] animate-pop"
          style={{ left: Math.min(Math.max(PAD.left + hover * slot + slot / 2, 60), Math.max(width - 60, 60)), top: 0 }}
        >
          <p className="font-semibold">{active.label}</p>
          <p className="tabular mt-0.5 text-muted">{formatValue(valueFormat, active.value)}</p>
        </div>
      ) : null}
    </div>
  );
}
