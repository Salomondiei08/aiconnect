"use client";

import * as React from "react";
import Link from "next/link";
import { Ban, Building2, CircleCheck, KeyRound, ShieldCheck, ShieldOff } from "lucide-react";
import { useAdminAction, FilterChips, matchesQuery, Pager, sortRows, SortHeader, TableSearch } from "@/components/admin/table-kit";
import { Badge, roleTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { revokeUserSessionsAction, setPlatformAdminAction, setUserActiveAction } from "@/lib/actions/platform";
import type { AdminUserRow } from "@/lib/admin";
import { cn, formatDate, formatRelative } from "@/lib/utils";

type SortKey = "name" | "email" | "role" | "company" | "createdAt" | "lastLoginAt" | "isActive" | "platformRole";
type StatusFilter = "all" | "active" | "inactive" | "platform";

const PAGE_SIZE = 15;

/**
 * Comptes de toute la plateforme : recherche instantanée, filtres, tri, et actions
 * (activer/désactiver, accorder/retirer le droit super-admin, fermer les sessions).
 */
export function PlatformUsersTable({ users, currentAdminId }: { users: AdminUserRow[]; currentAdminId: string }) {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [sort, setSort] = React.useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "createdAt", dir: "desc" });
  const [page, setPage] = React.useState(1);
  const { pending, run } = useAdminAction();

  const rows = React.useMemo(() => {
    const filtered = users.filter((user) => {
      if (status === "active" && !user.isActive) return false;
      if (status === "inactive" && user.isActive) return false;
      if (status === "platform" && user.platformRole !== "platform_admin") return false;
      if (!query.trim()) return true;
      return matchesQuery(`${user.name} ${user.username} ${user.email} ${user.company} ${user.role}`, query);
    });
    return sortRows(filtered, sort.key, sort.dir);
  }, [users, query, status, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "name" ? "asc" : "desc" }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips
          label="Filtrer les comptes"
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={[
            { key: "all", label: "Tous", count: users.length },
            { key: "active", label: "Actifs", count: users.filter((u) => u.isActive).length },
            { key: "inactive", label: "Désactivés", count: users.filter((u) => !u.isActive).length },
            { key: "platform", label: "Super-admins", count: users.filter((u) => u.platformRole === "platform_admin").length },
          ]}
        />
        <TableSearch
          value={query}
          onChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          placeholder="Rechercher un compte"
          label="Rechercher un compte"
        />
      </div>

      <div className="overflow-x-auto rounded-[1.25rem] border border-line bg-surface shadow-[var(--shadow-xs)]">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="bg-sunken text-xs uppercase tracking-wide text-muted">
            <tr>
              <SortHeader column="name" label="Compte" sort={sort} onSort={toggleSort} />
              <SortHeader column="role" label="Rôle" sort={sort} onSort={toggleSort} />
              <SortHeader column="company" label="Entreprise" sort={sort} onSort={toggleSort} />
              <SortHeader column="platformRole" label="Plateforme" sort={sort} onSort={toggleSort} />
              <SortHeader column="isActive" label="État" sort={sort} onSort={toggleSort} />
              <SortHeader column="lastLoginAt" label="Dernière connexion" sort={sort} onSort={toggleSort} />
              <SortHeader column="createdAt" label="Créé le" sort={sort} onSort={toggleSort} />
              <th scope="col" className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.map((user, index) => {
              const isSelf = user.id === currentAdminId;
              const platformAdmin = user.platformRole === "platform_admin";
              return (
                <tr
                  key={user.id}
                  className={cn("transition-colors hover:bg-sunken/45 animate-fade-up", !user.isActive && "text-muted")}
                  style={{ animationDelay: `${Math.min(index * 18, 260)}ms` }}
                >
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-xl text-[11px] font-bold",
                          platformAdmin ? "bg-spark-fill text-on-spark" : user.isActive ? "bg-brand-soft text-ink" : "bg-sunken text-muted",
                        )}
                      >
                        {user.name.slice(0, 2).toUpperCase() || user.username.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {user.name || user.username}
                          {isSelf ? <span className="ml-2 text-[11px] font-semibold text-spark">vous</span> : null}
                        </span>
                        <span className="block truncate text-xs text-muted">{user.email}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={roleTone(user.role)} size="sm">
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/entreprises/${user.companyId}`} className="inline-flex items-center gap-1.5 hover:text-spark hover:underline">
                      <Building2 className="size-3.5 text-muted" aria-hidden />
                      <span className="max-w-40 truncate">{user.company}</span>
                    </Link>
                    {user.companyStatus === "suspended" ? (
                      <span className="ml-2 rounded-full bg-danger-soft px-2 py-0.5 text-[11px] font-semibold text-danger">suspendue</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {platformAdmin ? (
                      <Badge tone="spark" size="sm">
                        <ShieldCheck className="size-3.5" aria-hidden /> Super-admin
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={user.isActive ? "moss" : "danger"} size="sm">
                      {user.isActive ? "Actif" : "Inactif"}
                    </Badge>
                    {!user.canLogin ? <span className="ml-2 text-[11px] text-muted">connexion refusée</span> : null}
                  </td>
                  <td className="px-4 py-3 text-muted">{user.lastLoginAt ? formatRelative(user.lastLoginAt) : "jamais"}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(user.createdAt)}</td>
                  <td className="px-3 py-2">
                    <span className="flex flex-wrap items-center gap-1">
                      {user.isActive ? (
                        <Button size="sm" variant="ghost" className="text-danger" disabled={pending} onClick={() => run(() => setUserActiveAction(user.id, false))}>
                          <Ban aria-hidden /> Désactiver
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="text-moss" disabled={pending} onClick={() => run(() => setUserActiveAction(user.id, true))}>
                          <CircleCheck aria-hidden /> Activer
                        </Button>
                      )}
                      {platformAdmin ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={pending || isSelf}
                          title={isSelf ? "Vous ne pouvez pas retirer votre propre droit" : undefined}
                          onClick={() => run(() => setPlatformAdminAction(user.id, false))}
                        >
                          <ShieldOff aria-hidden /> Retirer
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="text-spark" disabled={pending || !user.isActive} onClick={() => run(() => setPlatformAdminAction(user.id, true))}>
                          <ShieldCheck aria-hidden /> Super-admin
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted"
                        disabled={pending || user.sessions === 0}
                        title={user.sessions ? `${user.sessions} session(s) ouverte(s)` : "Aucune session ouverte"}
                        onClick={() => run(() => revokeUserSessionsAction(user.id))}
                      >
                        <KeyRound aria-hidden /> Sessions
                      </Button>
                    </span>
                  </td>
                </tr>
              );
            })}
            {shown.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted">
                  Aucun compte ne correspond à cette recherche.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Pager page={current} pages={pages} total={rows.length} pageSize={PAGE_SIZE} onPage={setPage} unit="compte(s)" />
    </div>
  );
}
