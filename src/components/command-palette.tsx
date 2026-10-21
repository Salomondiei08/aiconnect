"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CornerDownLeft,
  LayoutDashboard,
  Package,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sun,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  group: string;
  href?: string;
  icon: keyof typeof ICONS;
};

const ICONS = {
  dashboard: LayoutDashboard,
  sale: ShoppingCart,
  products: Package,
  users: Users,
  admin: ShieldCheck,
  plus: Plus,
  theme: Sun,
} satisfies Record<string, LucideIcon>;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Palette de commandes (Ctrl/Cmd + K) : navigation et actions fréquentes au clavier.
 * Rien n'est rendu tant qu'elle est fermée, pour ne pas ajouter de cibles parasites aux tests.
 */
export function CommandPalette({ items, open, onOpenChange }: { items: CommandItem[]; open: boolean; onOpenChange: (open: boolean) => void }) {
  const setOpen = onOpenChange;
  const [query, setQuery] = React.useState("");
  const [cursor, setCursor] = React.useState(0);
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [seenQuery, setSeenQuery] = React.useState(query);

  const results = React.useMemo(() => {
    const q = normalize(query.trim());
    const list = q ? items.filter((i) => normalize(`${i.label} ${i.hint ?? ""} ${i.group}`).includes(q)) : items;
    return list.slice(0, 12);
  }, [items, query]);

  // État dérivé : une nouvelle recherche replace le curseur sur le premier résultat.
  if (seenQuery !== query) {
    setSeenQuery(query);
    setCursor(0);
  }
  const activeIndex = Math.min(cursor, Math.max(0, results.length - 1));

  // Ctrl/Cmd + K ouvre la palette, Échap la referme : le raccourci est actif même palette fermée.
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(!open);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  React.useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const run = (item: CommandItem) => {
    setOpen(false);
    setQuery("");
    if (item.id === "toggle-theme") {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
      return;
    }
    if (item.href) router.push(item.href);
  };

  if (!open) return null;

  const grouped = results.reduce<Record<string, CommandItem[]>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[14vh] print:hidden" role="presentation">
      <button
        type="button"
        aria-label="Fermer la palette de commandes"
        className="absolute inset-0 cursor-default bg-ink/45 backdrop-blur-[2px] animate-fade-in"
        onClick={() => setOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Palette de commandes"
        className="glass relative w-full max-w-lg overflow-hidden rounded-2xl shadow-[var(--shadow-lg)] animate-scale-in"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-4 shrink-0 text-muted" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setCursor((c) => Math.min(c + 1, results.length - 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setCursor((c) => Math.max(c - 1, 0));
              } else if (event.key === "Enter") {
                event.preventDefault();
                const item = results[activeIndex];
                if (item) run(item);
              }
            }}
            placeholder="Rechercher une page ou une action…"
            aria-label="Rechercher une page ou une action"
            className="min-h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-muted/80"
          />
          <kbd className="hidden shrink-0 rounded-md border border-line bg-sunken px-1.5 py-0.5 text-[10px] font-semibold text-muted sm:block">Échap</kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">Aucun résultat pour « {query} ».</p>
          ) : (
            Object.entries(grouped).map(([group, groupItems]) => (
              <div key={group} className="mb-1">
                <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">{group}</p>
                <ul>
                  {groupItems.map((item) => {
                    const index = results.indexOf(item);
                    const Icon = ICONS[item.icon] ?? CornerDownLeft;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => run(item)}
                          onMouseEnter={() => setCursor(index)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                            index === activeIndex ? "bg-brand-soft text-ink" : "text-muted hover:bg-sunken hover:text-ink",
                          )}
                        >
                          <Icon className={cn("size-[17px] shrink-0", index === activeIndex ? "text-spark" : "opacity-70")} aria-hidden />
                          <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
                          {item.hint ? <span className="shrink-0 text-[11px] text-muted">{item.hint}</span> : null}
                          <CornerDownLeft className={cn("size-3.5 shrink-0", index === activeIndex ? "opacity-80" : "opacity-0")} aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        <p className="flex items-center gap-3 border-t border-line px-4 py-2.5 text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-line bg-sunken px-1 py-0.5 font-semibold">↑</kbd>
            <kbd className="rounded border border-line bg-sunken px-1 py-0.5 font-semibold">↓</kbd> naviguer
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-line bg-sunken px-1 py-0.5 font-semibold">↵</kbd> ouvrir
          </span>
        </p>
      </div>
    </div>
  );
}

/** Déclencheur + palette : un seul composant client côté coquille applicative. */
export function AppSearch({ items, className }: { items: CommandItem[]; className?: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <CommandPaletteTrigger onClick={() => setOpen(true)} className={className} />
      <CommandPalette items={items} open={open} onOpenChange={setOpen} />
    </>
  );
}

/** Bouton qui ouvre la palette ; le raccourci clavier reste actif partout. */
export function CommandPaletteTrigger({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Ouvrir la recherche rapide"
      className={cn(
        "group flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-3 text-sm text-muted transition-colors hover:border-spark/40 hover:text-ink",
        className,
      )}
    >
      <Search className="size-4" aria-hidden />
      <span className="hidden sm:inline">Rechercher…</span>
      <kbd className="hidden rounded-md border border-line bg-sunken px-1.5 py-0.5 text-[10px] font-semibold md:block">⌘K</kbd>
    </button>
  );
}
