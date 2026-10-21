"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppNav, type NavItem } from "./app-nav";

/**
 * Menu des écrans étroits : un tiroir de verre sous la barre haute, refermé à chaque navigation.
 * Le bouton reste la première cible « menu » de la page (contrat d'acceptation 04).
 */
export function MobileMenu({ items, footer }: { items: NavItem[]; footer: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={open}
        aria-controls="mobile-nav"
        onClick={() => setOpen((o) => !o)}
        className="text-muted hover:text-ink"
      >
        <span className="relative grid size-5 place-items-center">
          <Menu aria-hidden className="absolute size-5 transition-all duration-300 motion-reduce:transition-none" style={{ opacity: open ? 0 : 1, transform: open ? "rotate(90deg) scale(0.6)" : "none" }} />
          <X aria-hidden className="absolute size-5 transition-all duration-300 motion-reduce:transition-none" style={{ opacity: open ? 1 : 0, transform: open ? "none" : "rotate(-90deg) scale(0.6)" }} />
        </span>
      </Button>
      {open ? (
        <nav
          id="mobile-nav"
          aria-label="Navigation"
          className="glass-paper fixed inset-x-0 top-16 z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-line px-4 pb-6 pt-3 shadow-[var(--shadow-lg)] animate-fade-down"
        >
          <AppNav items={items} onNavigate={() => setOpen(false)} />
          <div className="mt-4 border-t border-line pt-4">{footer}</div>
        </nav>
      ) : null}
    </div>
  );
}
