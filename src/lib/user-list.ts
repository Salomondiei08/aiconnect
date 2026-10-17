/**
 * Liste des utilisateurs : colonnes, recherche et tri partagés par l'écran et les exports,
 * pour que l'export contienne exactement ce qui est affiché (RG8).
 */
export const USER_COLUMNS = [
  { key: "username", label: "Nom d'utilisateur" },
  { key: "name", label: "Nom" },
  { key: "role", label: "Rôle" },
  { key: "email", label: "E-mail" },
] as const;

export type UserColumn = (typeof USER_COLUMNS)[number]["key"];
export type UserListRow = Record<UserColumn, string>;

/** RG7 : recherche insensible à la casse sur les colonnes visibles. */
export function filterUsers<T extends UserListRow>(rows: T[], query: string, visible: UserColumn[]): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((r) => visible.some((c) => r[c].toLowerCase().includes(q)));
}

export function sortUsers<T extends UserListRow>(rows: T[], column: UserColumn, direction: "asc" | "desc"): T[] {
  const sign = direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => sign * a[column].localeCompare(b[column], "fr", { sensitivity: "base" }));
}

/** Colonnes demandées dans l'URL d'export, dans l'ordre d'affichage ; toutes par défaut. */
export function parseColumns(value: string | null): UserColumn[] {
  const asked = new Set((value ?? "").split(",").filter(Boolean));
  const cols = USER_COLUMNS.map((c) => c.key).filter((k) => asked.has(k));
  return cols.length ? cols : USER_COLUMNS.map((c) => c.key);
}

/** CSV compatible Excel : séparateur « ; » (usage français), BOM UTF-8, champs entre guillemets si besoin. */
export function toCsv(rows: UserListRow[], cols: UserColumn[]): string {
  const cell = (v: string) => (/[";\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  // Neutralise les formules (injection CSV) : une cellule ne commence jamais par = + - @.
  const safe = (v: string) => cell(/^[=+\-@]/.test(v) ? `'${v}` : v);
  const header = cols.map((c) => USER_COLUMNS.find((x) => x.key === c)!.label);
  return "﻿" + [header.map(cell), ...rows.map((r) => cols.map((c) => safe(r[c])))].map((l) => l.join(";")).join("\r\n") + "\r\n";
}
