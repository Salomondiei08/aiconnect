"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatValue, labelTicks, niceMax, smoothPath, useMeasure, type ValueFormat } from "./chart-utils";

export type SeriesPoint = { label: string; value: number };

const PAD = { top: 14, right: 12, bottom: 26, left: 46 };

/**
 * Courbe de ventes avec aire dégradée, réticule au survol et infobulle.
 * Dessinée en SVG aux dimensions réelles du conteneur : aucun étirement.
 */
export function AreaChart({
  data,
  height = 220,
  valueFormat = "compact",
  color = "var(--chart-1)",
  areaOpacity = 0.18,
  className,
  ariaLabel,
}: {
  data: SeriesPoint[];
  height?: number;
  valueFormat?: ValueFormat;
  color?: string;
  areaOpacity?: number;
  className?: string;
  ariaLabel?: string;
}) {
  const [ref, width] = useMeasure<HTMLDivElement>();
  const [hover, setHover] = React.useState<number | null>(null);
  const gradientId = React.useId();

  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = Math.max(0, height - PAD.top - PAD.bottom);
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;
  const points = data.map((d, i) => ({ x: PAD.left + i * stepX, y: PAD.top + innerH - (max ? (d.value / max) * innerH : 0) }));
  const line = smoothPath(points);
  const area = points.length ? `${line} L ${points[points.length - 1].x} ${PAD.top + innerH} L ${points[0].x} ${PAD.top + innerH} Z` : "";
  const ticks = labelTicks(data.length, width < 420 ? 4 : 7);
  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const active = hover != null ? data[hover] : null;
  const activePoint = hover != null ? points[hover] : null;

  return (
    <div ref={ref} className={cn("relative w-full", className)}>
      {width ? (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={ariaLabel ?? `Évolution sur ${data.length} périodes`}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            const x = event.clientX - box.left - PAD.left;
            const index = Math.round(x / (stepX || 1));
            setHover(Math.max(0, Math.min(data.length - 1, index)));
          }}
          className="touch-pan-y overflow-visible"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={areaOpacity * 3.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          {gridLines.map((t) => {
            const y = PAD.top + innerH * t;
            return (
              <g key={t}>
                <line x1={PAD.left} x2={PAD.left + innerW} y1={y} y2={y} stroke="var(--line)" strokeWidth={1} strokeDasharray={t === 1 ? undefined : "3 5"} opacity={t === 1 ? 1 : 0.7} />
                <text x={PAD.left - 10} y={y + 4} textAnchor="end" className="fill-[var(--muted)] text-[10px] tabular">
                  {formatValue(valueFormat, max * (1 - t))}
                </text>
              </g>
            );
          })}

          {area ? <path d={area} fill={`url(#${gradientId})`} className="animate-fade-in" style={{ animationDuration: "900ms" }} /> : null}
          {line ? (
            <path
              d={line}
              fill="none"
              stroke={color}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-draw-line"
              style={{ strokeDasharray: 2400, ["--dash" as string]: 2400 }}
            />
          ) : null}

          {ticks.map((i) => (
            <text key={i} x={points[i]?.x ?? 0} y={height - 6} textAnchor="middle" className="fill-[var(--muted)] text-[10px]">
              {data[i]?.label}
            </text>
          ))}

          {activePoint ? (
            <g>
              <line x1={activePoint.x} x2={activePoint.x} y1={PAD.top} y2={PAD.top + innerH} stroke={color} strokeWidth={1} strokeDasharray="3 4" opacity={0.6} />
              <circle cx={activePoint.x} cy={activePoint.y} r={6} fill={color} opacity={0.18} />
              <circle cx={activePoint.x} cy={activePoint.y} r={3.6} fill="var(--surface)" stroke={color} strokeWidth={2.4} />
            </g>
          ) : null}
        </svg>
      ) : (
        <div style={{ height }} className="skeleton w-full" />
      )}

      {active && activePoint ? (
        <div
          className="pointer-events-none absolute z-10 min-w-28 -translate-x-1/2 rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-[var(--shadow-md)] animate-pop"
          style={{ left: Math.min(Math.max(activePoint.x, 62), Math.max(width - 62, 62)), top: Math.max(activePoint.y - 62, 0) }}
        >
          <p className="font-semibold">{active.label}</p>
          <p className="tabular mt-0.5 text-muted">{formatValue(valueFormat, active.value)}</p>
        </div>
      ) : null}
    </div>
  );
}
