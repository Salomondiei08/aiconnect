"use client";

import * as React from "react";
import { formatXof } from "@/lib/utils";

/**
 * Largeur réelle du conteneur, mesurée après l'hydratation et à chaque redimensionnement.
 * Les graphiques dessinent en pixels réels : pas d'étirement des traits ni des étiquettes.
 */
export function useMeasure<T extends HTMLElement = HTMLDivElement>(): [React.RefObject<T | null>, number] {
  const ref = React.useRef<T | null>(null);
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => setWidth(node.clientWidth);
    update();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}

/** Borne supérieure « ronde » pour un axe (1000, 2000, 2500, 5000...). */
export function niceMax(value: number): number {
  if (value <= 0) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

/** Index des étiquettes d'axe à conserver pour ne pas se chevaucher. */
export function labelTicks(count: number, maxLabels: number): number[] {
  if (count <= maxLabels) return Array.from({ length: count }, (_, i) => i);
  const stride = Math.ceil(count / maxLabels);
  const ticks: number[] = [];
  for (let i = 0; i < count; i += stride) ticks.push(i);
  if (ticks[ticks.length - 1] !== count - 1) ticks.push(count - 1);
  return ticks;
}

/** Chemin lissé (Catmull-Rom converti en Béziers) : la courbe moderne des graphiques de ventes. */
export function smoothPath(points: { x: number; y: number }[], tension = 0.32): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + ((p2.x - p0.x) / 6) * tension * 3;
    const c1y = p1.y + ((p2.y - p0.y) / 6) * tension * 3;
    const c2x = p2.x - ((p3.x - p1.x) / 6) * tension * 3;
    const c2y = p2.y - ((p3.y - p1.y) / 6) * tension * 3;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/** Formate une valeur d'axe en kilo/million pour rester court (1,2 k / 3,4 M). */
export function compactNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
  if (abs >= 10_000) return `${Math.round(value / 1000)} k`;
  if (abs >= 1000) return `${(value / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} k`;
  return value.toLocaleString("fr-FR");
}

/** Formats de valeurs proposés aux graphiques : le serveur choisit un nom, jamais une fonction. */
export type ValueFormat = "xof" | "xofShort" | "count" | "compact";

export function formatValue(kind: ValueFormat, value: number): string {
  switch (kind) {
    case "xof":
      return formatXof(value);
    case "xofShort":
      return formatXof(value).replace(" FCFA", "");
    case "count":
      return `${Math.round(value)}`;
    default:
      return compactNumber(value);
  }
}
