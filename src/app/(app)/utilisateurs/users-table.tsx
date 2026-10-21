"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Columns3, Download, Pencil, Eye, Printer, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge, Dot, roleTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { deactivateUserAction } from "@/lib/actions/users";
import { filterUsers, sortUsers, USER_COLUMNS, type UserColumn } from "@/lib/user-list";
import { cn } from "@/lib/utils";

export type UserRow = { id: string; username: string; name: string; role: string; email: string; isActive: boolean; isSelf: boolean };

const PAGE_SIZES = [10, 25, 50, 100];

/** Initiales pour l'avatar d'un utilisateur. */
function initialsOf(name: string, username: string): string {
  const parts = (name || username).trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Tableau des utilisateurs (6.1) : recherche instantanée (RG7), tri par colonne, colonnes masquables,
 * pagination et exports qui reprennent les colonnes visibles et le filtre (RG8).
 */
export function UsersTable({ rows }: { rows: UserRow[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ column: UserColumn; dir: "asc" | "desc" }>({ column: "username", dir: "asc" });
  const [visible, setVisible] = useState<UserColumn[]>(USER_COLUMNS.map((c) => c.key));
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => sortUsers(filterUsers(rows, query, visible), sort.column, sort.dir), [rows, query, visible, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const start = (current - 1) * pageSize;
  const shown = filtered.slice(start, start + pageSize);

  const toggleSort = (column: UserColumn) =>
    setSort((s) => (s.column === column ? { column, dir: s.dir === "asc" ? "desc" : "asc" } : { column, dir: "asc" }));
  const exportUrl = (format: string) =>
    `/api/utilisateurs/export?${new URLSearchParams({ format, q: query, cols: visible.join(","), sort: sort.column, dir: sort.dir })}`;

  const activeCount = rows.filter((r) => r.isActive).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <Badge tone="brand">{rows.length} compte(s)</Badge>
        <Badge tone="moss">
          <Dot tone="moss" /> {activeCount} actif(s)
        </Badge>
        {rows.length - activeCount > 0 ? <Badge tone="danger">{rows.length - activeCount} désactivé(s)</Badge> : null}
      </div>

      <div className="flex flex-col gap-3 print:hidden lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="page-size" className="text-sm text-muted">
            Afficher
          </label>
          <NativeSelect
            id="page-size"
            wrapperClassName="w-24"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </NativeSelect>
          <span className="text-sm text-muted">entrées</span>
          <a href={exportUrl("csv")} className={toolClass}>
            <Download className="size-4" aria-hidden /> CSV
          </a>
          <a href={exportUrl("xlsx")} className={toolClass}>
            <Download className="size-4" aria-hidden /> Excel
          </a>
          <a href={exportUrl("pdf")} className={toolClass}>
            <Download className="size-4" aria-hidden /> PDF
          </a>
          <button type="button" onClick={() => window.print()} className={toolClass}>
            <Printer className="size-4" aria-hidden /> Imprimer
          </button>
          <details className="relative">
            <summary className={cn(toolClass, "cursor-pointer list-none")}>
              <Columns3 className="size-4" aria-hidden /> Colonnes
            </summary>
            <div className="absolute left-0 z-20 mt-2 w-56 space-y-1 rounded-xl border border-line bg-surface p-3 shadow-[var(--shadow-lg)] animate-fade-down">
              {USER_COLUMNS.map((c) => (
                <div key={c.key} className="flex min-h-11 items-center gap-3">
                  <Checkbox
                    id={`col-${c.key}`}
                    checked={visible.includes(c.key)}
                    // Au moins une colonne reste visible.
                    disabled={visible.length === 1 && visible.includes(c.key)}
                    onCheckedChange={(on) =>
                      setVisible((v) => (on ? USER_COLUMNS.map((x) => x.key).filter((k) => k === c.key || v.includes(k)) : v.filter((k) => k !== c.key)))
                    }
                  />
                  <label htmlFor={`col-${c.key}`} className="text-sm">
                    {c.label}
                  </label>
                </div>
              ))}
            </div>
          </details>
        </div>
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input
            type="search"
            aria-label="Rechercher"
            placeholder="Rechercher"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-[1.25rem] border border-line bg-surface shadow-[var(--shadow-xs)]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-sunken text-xs uppercase tracking-wide text-muted">
            <tr>
              {USER_COLUMNS.filter((c) => visible.includes(c.key)).map((c) => {
                const active = sort.column === c.key;
                const Icon = active ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
                return (
                  <th key={c.key} scope="col" aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} className="px-2 py-1 font-semibold">
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 uppercase transition-colors hover:text-ink"
                    >
                      {c.label}
                      <Icon className={cn("size-3.5 transition-colors", active ? "text-spark" : "opacity-50")} aria-hidden />
                    </button>
                  </th>
                );
              })}
              <th scope="col" className="px-4 py-3 font-semibold print:hidden">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => (
              <Row key={row.id} row={row} visible={visible} />
            ))}
            {shown.length === 0 ? (
              <tr>
                <td colSpan={visible.length + 1} className="px-4 py-6 text-center text-muted">
                  Aucun utilisateur ne correspond à la recherche.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 text-sm print:hidden sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted" aria-live="polite">
          {filtered.length ? `Affiche ${start + 1} à ${start + shown.length} sur ${filtered.length} entrées` : "Affiche 0 entrée"}
          {query ? ` (filtré à partir de ${rows.length} entrées au total)` : ""}
        </p>
        <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1">
          <Button size="sm" variant="secondary" disabled={current === 1} onClick={() => setPage(current - 1)}>
            Précédent
          </Button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Button
              key={n}
              size="sm"
              variant={n === current ? "default" : "ghost"}
              aria-current={n === current ? "page" : undefined}
              onClick={() => setPage(n)}
              className={cn(n === current && "shadow-[var(--shadow-xs)]")}
            >
              {n}
            </Button>
          ))}
          <Button size="sm" variant="secondary" disabled={current === pages} onClick={() => setPage(current + 1)}>
            Prochain
          </Button>
        </nav>
      </div>
    </div>
  );
}

const toolClass =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-[13px] font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:border-spark/40 hover:text-spark";

function Row({ row, visible }: { row: UserRow; visible: UserColumn[] }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const erase = () =>
    startTransition(async () => {
      const result = await deactivateUserAction(row.id);
      if (result.error) toast.error(result.error);
      else toast.success("Utilisateur désactivé");
      setConfirming(false);
    });
  return (
    <tr className={cn("border-t border-line transition-colors hover:bg-sunken/45", !row.isActive && "text-muted")}>
      {visible.includes("username") ? (
        <td className="px-4 py-3">
          <span className="flex items-center gap-3">
            <span
              aria-hidden
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-xl text-[11px] font-bold transition-transform duration-300",
                row.isActive ? "bg-brand-soft text-ink" : "bg-sunken text-muted",
              )}
            >
              {initialsOf(row.name, row.username)}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium">{row.username}</span>
              {row.isSelf ? <span className="text-[11px] font-semibold text-spark">vous</span> : null}
            </span>
          </span>
        </td>
      ) : null}
      {visible.includes("name") ? (
        <td className="px-4 py-3">
          {row.name}
          {row.isActive ? null : (
            <span className="ml-2 rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">Inactif</span>
          )}
        </td>
      ) : null}
      {visible.includes("role") ? (
        <td className="px-4 py-3">
          <Badge tone={roleTone(row.role)} size="sm">
            {row.role}
          </Badge>
        </td>
      ) : null}
      {visible.includes("email") ? <td className="px-4 py-3 text-muted">{row.email}</td> : null}
      <td className="px-2 py-1.5 print:hidden">
        {confirming ? (
          <span className="flex gap-2 animate-fade-in">
            <Button size="sm" variant="danger" onClick={erase} disabled={pending}>
              Confirmer
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setConfirming(false)}>
              Annuler
            </Button>
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <Link href={`/utilisateurs/${row.id}/modifier`} className={actionClass}>
              <Pencil className="size-4" aria-hidden /> Modifier
            </Link>
            <Link href={`/utilisateurs/${row.id}`} className={actionClass}>
              <Eye className="size-4" aria-hidden /> Voir
            </Link>
            <Button
              size="sm"
              variant="ghost"
              className="text-danger"
              disabled={row.isSelf || !row.isActive}
              title={row.isSelf ? "Vous ne pouvez pas supprimer votre propre compte" : undefined}
              onClick={() => setConfirming(true)}
            >
              <Trash2 aria-hidden /> Effacer
            </Button>
          </span>
        )}
      </td>
    </tr>
  );
}

const actionClass = "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-link transition-colors hover:bg-sunken";
