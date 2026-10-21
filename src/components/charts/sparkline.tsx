"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { smoothPath, useMeasure } from "./chart-utils";

/**
 * Mini-courbe sans axe, pour une carte ou une ligne de tableau.
 * Le trait se dessine à l'apparition ; l'aire suit en fondu.
 */
export function Sparkline({
  values,
  height = 40,
  color = "var(--chart-1)",
  className,
  label,
}: {
  values: number[];
  height?: number;
  color?: string;
  className?: string;
  label?: string;
}) {
  const [ref, width] = useMeasure<HTMLDivElement>();
  const gradientId = React.useId();
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const stepX = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((v, i) => ({ x: i * stepX, y: height - 3 - ((v - min) / span) * (height - 8) }));
  const line = smoothPath(points, 0.28);
  const area = points.length ? `${line} L ${width} ${height} L 0 ${height} Z` : "";

  return (
    <div ref={ref} className={cn("w-full", className)} style={{ height }}>
      {width ? (
        <svg width={width} height={height} role="img" aria-label={label ?? "Tendance"} className="overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.34} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {area ? <path d={area} fill={`url(#${gradientId})`} className="animate-fade-in" /> : null}
          {line ? (
            <path
              d={line}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              className="animate-draw-line"
              style={{ strokeDasharray: 1200, ["--dash" as string]: 1200 }}
            />
          ) : null}
          {points.length ? <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={2.8} fill={color} /> : null}
        </svg>
      ) : null}
    </div>
  );
}
