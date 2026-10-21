"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatValue, type ValueFormat } from "./chart-utils";

export type DonutSlice = { label: string; value: number; color?: string };

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

/**
 * Anneau de répartition (état du stock, statuts d'envoi) : les segments se dessinent à l'apparition,
 * le centre affiche la part survolée.
 */
export function DonutChart({
  data,
  size = 168,
  thickness = 18,
  centerLabel,
  valueFormat = "compact",
  className,
}: {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  valueFormat?: ValueFormat;
  className?: string;
}) {
  const [hover, setHover] = React.useState<number | null>(null);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const active = hover != null ? data[hover] : null;

  return (
    <div className={cn("flex flex-wrap items-center gap-5", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label={centerLabel ?? "Répartition"} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--sunken)" strokeWidth={thickness} />
          {total > 0
            ? data.map((d, i) => {
                const length = (d.value / total) * circumference;
                const dash = `${length} ${circumference - length}`;
                const circle = (
                  <circle
                    key={d.label}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={d.color ?? PALETTE[i % PALETTE.length]}
                    strokeWidth={hover === i ? thickness + 4 : thickness}
                    strokeDasharray={dash}
                    strokeDashoffset={-offset}
                    strokeLinecap="butt"
                    opacity={hover == null || hover === i ? 1 : 0.42}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                    className="animate-donut-draw"
                    style={{
                      ["--donut-circ" as string]: circumference,
                      ["--donut-len" as string]: length,
                      ["--donut-rest" as string]: circumference - length,
                      animationDelay: `${i * 70}ms`,
                      transition: "stroke-width 180ms ease, opacity 180ms ease",
                    }}
                  />
                );
                offset += length;
                return circle;
              })
            : null}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <p className="tabular text-xl font-semibold leading-none">{active ? formatValue(valueFormat, active.value) : formatValue(valueFormat, total)}</p>
          <p className="mt-1 max-w-[7.5rem] text-[11px] leading-tight text-muted">{active ? active.label : centerLabel}</p>
        </div>
      </div>

      <ul className="min-w-32 flex-1 space-y-2 text-sm">
        {data.map((d, i) => (
          <li
            key={d.label}
            className={cn("flex cursor-default items-center justify-between gap-3 rounded-lg px-2 py-1 transition-colors", hover === i && "bg-sunken")}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: d.color ?? PALETTE[i % PALETTE.length] }} />
              <span className="truncate">{d.label}</span>
            </span>
            <span className="tabular shrink-0 font-semibold">{total ? Math.round((d.value / total) * 100) : 0} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
