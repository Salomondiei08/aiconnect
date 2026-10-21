"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * Barre de progression en haut de l'écran pendant une navigation.
 * Déclenchée par un clic sur un lien interne, arrêtée quand le chemin change.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const [loading, setLoading] = React.useState(false);
  const lastPath = React.useRef(pathname);
  const safetyRef = React.useRef<number | null>(null);

  // Le chemin a changé : on laisse la barre se terminer puis on la retire.
  React.useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    const timer = window.setTimeout(() => setLoading(false), 420);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  React.useEffect(() => () => { if (safetyRef.current) window.clearTimeout(safetyRef.current); }, []);

  React.useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:") || anchor.target === "_blank") return;
      if (anchor.hasAttribute("download")) return;
      if (href === pathname || href === `${pathname}/`) return;
      setLoading(true);
      // Filet de sécurité : une navigation annulée ne doit pas laisser la barre allumée.
      if (safetyRef.current) window.clearTimeout(safetyRef.current);
      safetyRef.current = window.setTimeout(() => setLoading(false), 8_000);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 print:hidden">
      <div
        className={
          loading
            ? "h-full w-2/3 bg-gradient-to-r from-spark-fill via-spark to-brand opacity-100 transition-[width] duration-[3000ms] ease-out"
            : "h-full w-0 bg-spark-fill opacity-0 transition-opacity duration-300"
        }
      />
    </div>
  );
}
