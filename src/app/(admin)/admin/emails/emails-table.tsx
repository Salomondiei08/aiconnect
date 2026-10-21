"use client";

import * as React from "react";
import Link from "next/link";
import { AlertOctagon, Building2, CheckCircle2, Clock3, MailQuestion } from "lucide-react";
import { FilterChips, matchesQuery, Pager, sortRows, SortHeader, TableSearch } from "@/components/admin/table-kit";
import { Badge } from "@/components/ui/badge";
import type { AdminEmailRow } from "@/lib/admin";
import { cn, formatDateTime, formatRelative } from "@/lib/utils";

type SortKey = "createdAt" | "type" | "status" | "to" | "company";
type StatusFilter = "all" | "delivered" | "pending" | "failed";

const PAGE_SIZE = 20;

const STATUS_TONE: Record<string, "moss" | "danger" | "ochre" | "neutral" | "spark"> = {
  delivered: "moss",
  sent: "spark",
  queued: "neutral",
  delayed: "ochre",
  bounced: "danger",
  failed: "danger",
  complained: "danger",
};

const STATUS_LABELS: Record<string, string> = {
  delivered: "Livrés",
  sent: "Acceptés",
  queued: "En attente",
  delayed: "Retardés",
  bounced: "Rejetés",
  failed: "Échoués",
  complained: "Plaintes",
};

function StatusIcon({ status }: { status: string }) {
  if (status === "delivered") return <CheckCircle2 className="size-4 text-moss" aria-hidden />;
  if (status === "failed" || status === "bounced" || status === "complained") return <AlertOctagon className="size-4 text-danger" aria-hidden />;
  if (status === "delayed") return <Clock3 className="size-4 text-ochre" aria-hidden />;
  return <MailQuestion className="size-4 text-muted" aria-hidden />;
}

/** Journal des envois : filtres par statut, recherche, tri, et détail de l'erreur expurgée. */
export function EmailsTable({ emails, typeLabels }: { emails: AdminEmailRow[]; typeLabels: Record<string, string> }) {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [sort, setSort] = React.useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "createdAt", dir: "desc" });
  const [page, setPage] = React.useState(1);

  const rows = React.useMemo(() => {
    const filtered = emails.filter((email) => {
      if (status === "delivered" && email.status !== "delivered") return false;
      if (status === "pending" && !["queued", "sent", "delayed"].includes(email.status)) return false;
      if (status === "failed" && !["failed", "bounced", "complained"].includes(email.status)) return false;
      if (!query.trim()) return true;
      return matchesQuery(`${email.to} ${email.subject} ${email.company ?? ""} ${typeLabels[email.type] ?? email.type}`, query);
    });
    return sortRows(filtered, sort.key, sort.dir);
  }, [emails, query, status, sort, typeLabels]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));

  const counts = {
    all: emails.length,
    delivered: emails.filter((e) => e.status === "delivered").length,
    pending: emails.filter((e) => ["queued", "sent", "delayed"].includes(e.status)).length,
    failed: emails.filter((e) => ["failed", "bounced", "complained"].includes(e.status)).length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips
          label="Filtrer par statut"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={[
            { key: "all", label: "Tous", count: counts.all },
            { key: "delivered", label: "Livrés", count: counts.delivered },
            { key: "pending", label: "En cours", count: counts.pending },
            { key: "failed", label: "Échecs", count: counts.failed },
          ]}
        />
        <TableSearch
          value={query}
          onChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          placeholder="Destinataire, sujet, entreprise"
          label="Rechercher un envoi"
        />
      </div>

      <div className="overflow-x-auto rounded-[1.25rem] border border-line bg-surface shadow-[var(--shadow-xs)]">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-sunken text-xs uppercase tracking-wide text-muted">
            <tr>
              <SortHeader column="createdAt" label="Date" sort={sort} onSort={toggleSort} />
              <SortHeader column="type" label="Type" sort={sort} onSort={toggleSort} />
              <SortHeader column="to" label="Destinataire" sort={sort} onSort={toggleSort} />
              <SortHeader column="company" label="Entreprise" sort={sort} onSort={toggleSort} />
              <SortHeader column="status" label="Statut" sort={sort} onSort={toggleSort} />
              <th scope="col" className="px-4 py-3 text-right font-semibold">Essais</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.map((email, index) => (
              <tr key={email.id} className="transition-colors hover:bg-sunken/45 animate-fade-up" style={{ animationDelay: `${Math.min(index * 14, 200)}ms` }}>
                <td className="px-4 py-3">
                  <span className="block font-medium">{formatRelative(email.createdAt)}</span>
                  <span className="block text-xs text-muted">{formatDateTime(email.createdAt)}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge tone="neutral" size="sm">
                    {typeLabels[email.type] ?? email.type}
                  </Badge>
                  <span className="mt-1 block max-w-60 truncate text-xs text-muted" title={email.subject}>
                    {email.subject}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="block max-w-56 truncate font-medium">{email.to}</span>
                </td>
                <td className="px-4 py-3">
                  {email.companyId ? (
                    <Link href={`/admin/entreprises/${email.companyId}`} className="inline-flex max-w-44 items-center gap-1.5 hover:text-spark hover:underline">
                      <Building2 className="size-3.5 shrink-0 text-muted" aria-hidden />
                      <span className="truncate">{email.company ?? "—"}</span>
                    </Link>
                  ) : (
                    <span className="text-xs text-muted">hors entreprise</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-2">
                    <StatusIcon status={email.status} />
                    <Badge tone={STATUS_TONE[email.status] ?? "neutral"} size="sm">
                      {STATUS_LABELS[email.status] ?? email.status}
                    </Badge>
                  </span>
                  {email.error ? <span className={cn("mt-1 block max-w-64 truncate text-xs text-danger")} title={email.error}>{email.error}</span> : null}
                </td>
                <td className="tabular px-4 py-3 text-right">{email.attempts}</td>
              </tr>
            ))}
            {shown.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  Aucun envoi ne correspond à ces critères.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Pager page={current} pages={pages} total={rows.length} pageSize={PAGE_SIZE} onPage={setPage} unit="envoi(s)" />
    </div>
  );
}
