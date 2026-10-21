"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Appel d'une action plateforme : état pending, toast de résultat et revalidation. */
export function useAdminAction() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const run = (action: () => Promise<{ ok: boolean; message: string }>) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      router.refresh();
    });
  return { pending, run };
}

/** Champ de recherche instantanée, style commun aux tableaux de l'espace plateforme. */
export function TableSearch({
  value,
  onChange,
  placeholder = "Rechercher",
  label = "Rechercher",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full lg:max-w-xs", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <Input type="search" aria-label={label} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} className="pl-10" />
    </div>
  );
}

/** Filtres par puces (statut, type…). */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { key: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-full border border-line bg-sunken/60 p-1" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          aria-pressed={value === option.key}
          className={cn(
            "min-h-9 shrink-0 rounded-full px-3.5 text-[13px] font-semibold transition-all duration-200",
            value === option.key ? "bg-surface text-ink shadow-[var(--shadow-xs)]" : "text-muted hover:text-ink",
          )}
        >
          {option.label}
          {option.count != null ? <span className="tabular ml-1.5 text-[11px] opacity-70">{option.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

/** En-tête de colonne triable. */
export function SortHeader<T extends string>({
  column,
  label,
  sort,
  onSort,
  align = "left",
  className,
}: {
  column: T;
  label: string;
  sort: { key: T; dir: "asc" | "desc" };
  onSort: (column: T) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const active = sort.key === column;
  const Icon = active ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th scope="col" className={cn("px-2 py-1 font-semibold", align === "right" && "text-right", className)}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 uppercase transition-colors hover:text-ink",
          align === "right" && "justify-end",
        )}
      >
        {label}
        <Icon className={cn("size-3.5 transition-colors", active ? "text-spark" : "opacity-45")} aria-hidden />
      </button>
    </th>
  );
}

/** Tri client générique sur une clé de ligne. */
export function sortRows<T, K extends keyof T>(rows: T[], key: K, dir: "asc" | "desc"): T[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const left = a[key];
    const right = b[key];
    if (left instanceof Date || right instanceof Date) return sign * (new Date(left as never).getTime() - new Date(right as never).getTime());
    if (typeof left === "number" && typeof right === "number") return sign * (left - right);
    if (typeof left === "boolean" && typeof right === "boolean") return sign * Number(left) - Number(right);
    return sign * String(left ?? "").localeCompare(String(right ?? ""), "fr", { sensitivity: "base" });
  });
}

/** Recherche insensible à la casse et aux accents sur plusieurs champs. */
export function matchesQuery(value: string, query: string): boolean {
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  return normalize(value).includes(normalize(query.trim()));
}

/** Pagination compacte partagée par les tableaux plateforme. */
export function Pager({
  page,
  pages,
  total,
  pageSize,
  onPage,
  unit = "entrées",
}: {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
  unit?: string;
}) {
  const start = (page - 1) * pageSize;
  return (
    <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted" aria-live="polite">
        {total ? `Affiche ${start + 1} à ${Math.min(start + pageSize, total)} sur ${total} ${unit}` : `Aucune ${unit}`}
      </p>
      <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1">
        <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => onPage(page - 1)}>
          Précédent
        </Button>
        {Array.from({ length: pages }, (_, index) => index + 1)
          .filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1)
          .map((n, index, list) => (
            <React.Fragment key={n}>
              {index > 0 && n - list[index - 1] > 1 ? <span className="px-1 text-muted">…</span> : null}
              <Button size="sm" variant={n === page ? "default" : "ghost"} aria-current={n === page ? "page" : undefined} onClick={() => onPage(n)}>
                {n}
              </Button>
            </React.Fragment>
          ))}
        <Button size="sm" variant="secondary" disabled={page === pages} onClick={() => onPage(page + 1)}>
          Prochain
        </Button>
      </nav>
    </div>
  );
}

/** Classe commune des outils de barre (boutons et liens d'action). */
export const adminToolClass =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:border-spark/40 hover:text-spark";
