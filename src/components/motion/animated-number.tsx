"use client";

import * as React from "react";

/** Formate un montant en XOF sans dépendance serveur (même rendu que `formatXof`). */
export function xof(value: number): string {
  const sign = value < 0 ? "-" : "";
  const digits = Math.abs(Math.round(value))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}${digits} FCFA`;
}

/** Suit la préférence « mouvement réduit » sans effet ni setState (même mécanisme que le thème). */
function usePrefersReducedMotion(): boolean {
  return React.useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/**
 * Compteur animé : la valeur affichée rejoint sa cible en ~700 ms.
 * Le texte final est exactement la valeur cible (les tests d'acceptation lisent les chiffres de la carte).
 */
export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString("fr-FR"),
  duration = 700,
  className,
}: {
  value: number;
  format?: (value: number) => string;
  duration?: number;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = React.useState(value);
  const fromRef = React.useRef(value);
  const frameRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    // Mouvement réduit : la cible est affichée telle quelle, sans état intermédiaire ni animation.
    if (reduced) {
      fromRef.current = to;
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // Ease-out cubic : démarre vite, se pose doucement.
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (to - from) * eased;
      setDisplay(next);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
        setDisplay(to);
      }
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      fromRef.current = to;
    };
  }, [value, duration, reduced]);

  return (
    <span className={className} suppressHydrationWarning>
      {format(reduced ? value : display)}
    </span>
  );
}

/** Montant en XOF animé. */
export function AnimatedXof({ value, className }: { value: number; className?: string }) {
  return <AnimatedNumber value={value} format={xof} className={className} />;
}
