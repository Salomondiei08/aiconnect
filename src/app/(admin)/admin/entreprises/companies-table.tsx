"use client";

import * as React from "react";
import Link from "next/link";
import { Ban, CircleCheck, Eye } from "lucide-react";
import { useAdminAction, FilterChips, matchesQuery, Pager, sortRows, SortHeader, TableSearch } from "@/components/admin/table-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setCompanyStatusAction } from "@/lib/actions/platform";
import type { AdminCompanyRow } from "@/lib/admin";
import { cn, formatDate, formatXof } from "@/lib/utils";

type SortKey = "name" | "createdAt" | "users" | "products" | "sales" | "revenue" | "status";
type StatusFilter = "all" | "active" | "suspended";

const PAGE_SIZE = 12;

/** Tableau des entreprises : recherche instantanée, filtres d'état, tri et suspension/réactivation. */
export function CompaniesTable({ companies }: { companies: AdminCompanyRow[] }) {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [sort, setSort] = React.useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "createdAt", dir: "desc" });
  const [page, setPage] = React.useState(1);
  const { pending, run } = useAdminAction();

  const rows = React.useMemo(() => {
    const filtered = companies.filter((company) => {
      if (status !== "all" && company.status !== status) return false;
      if (!query.trim()) return true;
      return matchesQuery(`${company.name} ${company.city} ${company.country}`, query);
    });
    return sortRows(filtered, sort.key, sort.dir);
  }, [companies, query, status, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "name" ? "asc" : "desc" }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips
          label="Filtrer par état"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={[
            { key: "all", label: "Toutes", count: companies.length },
            { key: "active", label: "Actives", count: companies.filter((c) => c.status === "active").length },
            { key: "suspended", label: "Suspendues", count: companies.filter((c) => c.status === "suspended").length },
          ]}
        />
        <TableSearch
          value={query}
          onChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          placeholder="Rechercher une entreprise"
          label="Rechercher une entreprise"
        />
      </div>

      <div className="overflow-x-auto rounded-[1.25rem] border border-line bg-surface shadow-[var(--shadow-xs)]">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-sunken text-xs uppercase tracking-wide text-muted">
            <tr>
              <SortHeader column="name" label="Entreprise" sort={sort} onSort={toggleSort} />
              <SortHeader column="status" label="État" sort={sort} onSort={toggleSort} />
              <SortHeader column="users" label="Comptes" sort={sort} onSort={toggleSort} align="right" />
              <SortHeader column="products" label="Produits" sort={sort} onSort={toggleSort} align="right" />
              <SortHeader column="sales" label="Ventes" sort={sort} onSort={toggleSort} align="right" />
              <SortHeader column="revenue" label="Chiffre d'affaires" sort={sort} onSort={toggleSort} align="right" />
              <SortHeader column="createdAt" label="Inscrite le" sort={sort} onSort={toggleSort} />
              <th scope="col" className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.map((company, index) => (
              <tr
                key={company.id}
                className={cn("transition-colors hover:bg-sunken/45 animate-fade-up", company.status === "suspended" && "bg-danger-soft/25")}
                style={{ animationDelay: `${Math.min(index * 22, 300)}ms` }}
              >
                <td className="px-4 py-3">
                  <span className="flex items-center gap-3">
                    <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-[11px] font-bold">
                      {company.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <Link href={`/admin/entreprises/${company.id}`} className="block truncate font-semibold hover:text-spark hover:underline">
                        {company.name}
                      </Link>
                      <span className="block truncate text-xs text-muted">
                        {company.city} · {company.country}
                      </span>
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={company.status === "active" ? "moss" : "danger"} size="sm">
                    {company.status === "active" ? "Active" : "Suspendue"}
                  </Badge>
                </td>
                <td className="tabular px-4 py-3 text-right">
                  {company.users}
                  {company.activeUsers !== company.users ? <span className="ml-1 text-xs text-muted">({company.activeUsers} actif(s))</span> : null}
                </td>
                <td className="tabular px-4 py-3 text-right">{company.products}</td>
                <td className="tabular px-4 py-3 text-right">{company.sales}</td>
                <td className="tabular px-4 py-3 text-right font-semibold">{formatXof(company.revenue)}</td>
                <td className="px-4 py-3 text-muted">{formatDate(company.createdAt)}</td>
                <td className="px-3 py-2">
                  <span className="flex items-center gap-1">
                    <Link
                      href={`/admin/entreprises/${company.id}`}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-link transition-colors hover:bg-sunken"
                    >
                      <Eye className="size-4" aria-hidden /> Voir
                    </Link>
                    {company.status === "active" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-danger"
                        disabled={pending}
                        onClick={() => run(() => setCompanyStatusAction(company.id, "suspended"))}
                      >
                        <Ban aria-hidden /> Suspendre
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="text-moss" disabled={pending} onClick={() => run(() => setCompanyStatusAction(company.id, "active"))}>
                        <CircleCheck aria-hidden /> Réactiver
                      </Button>
                    )}
                  </span>
                </td>
              </tr>
            ))}
            {shown.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted">
                  Aucune entreprise ne correspond à cette recherche.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Pager page={current} pages={pages} total={rows.length} pageSize={PAGE_SIZE} onPage={setPage} unit="entreprise(s)" />
    </div>
  );
}
