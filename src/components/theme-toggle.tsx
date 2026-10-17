"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

/** Bascule clair/sombre. Icône lune au rendu serveur, état réel une fois hydraté. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // true côté client, false pendant le rendu serveur : pas d'écart d'hydratation.
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const dark = mounted && resolvedTheme === "dark";
  return (
    <Button type="button" variant="ghost" size="icon" onClick={() => setTheme(dark ? "light" : "dark")} aria-label="Changer de thème (clair ou sombre)" className="text-muted-foreground hover:text-ink">
      {dark ? <Sun className="size-[18px]" aria-hidden /> : <Moon className="size-[18px]" aria-hidden />}
    </Button>
  );
}
