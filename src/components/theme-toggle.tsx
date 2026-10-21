"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

/**
 * Bascule clair/sombre : un seul bouton, dont le nom accessible contient « thème »
 * (contrat d'acceptation 01.5). Icône lune au rendu serveur, état réel une fois hydraté.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // true côté client, false pendant le rendu serveur : pas d'écart d'hydratation.
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const dark = mounted && resolvedTheme === "dark";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label="Changer de thème (clair ou sombre)"
      aria-pressed={dark}
      className="relative overflow-hidden text-muted hover:text-ink"
    >
      <span className="pointer-events-none absolute inset-0 rounded-full bg-spark-soft/0 transition-colors duration-300 hover:bg-spark-soft/60" aria-hidden />
      <span className="relative grid place-items-center transition-transform duration-500 ease-out motion-reduce:transition-none" style={{ transform: dark ? "rotate(0deg) scale(1)" : "rotate(-25deg) scale(1)" }}>
        {dark ? <Sun className="size-[18px] text-ochre" aria-hidden /> : <Moon className="size-[18px]" aria-hidden />}
      </span>
    </Button>
  );
}
