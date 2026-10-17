"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppNav, type NavItem } from "./app-nav";

/** Menu des écrans étroits : un tiroir sous la barre haute, refermé à chaque navigation. */
export function MobileMenu({ items, footer }: { items: NavItem[]; footer: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <Button type="button" variant="ghost" size="icon" aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((o) => !o)}>
        {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
      </Button>
      {open ? (
        <nav id="mobile-nav" aria-label="Navigation" className="fixed inset-x-0 top-16 z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-line bg-paper px-4 pb-6 pt-3 shadow-lg">
          <AppNav items={items} onNavigate={() => setOpen(false)} />
          <div className="mt-4 border-t border-line pt-4">{footer}</div>
        </nav>
      ) : null}
    </div>
  );
}
