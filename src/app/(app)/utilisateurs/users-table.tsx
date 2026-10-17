"use client";

import { useMemo, useState, useTransition } from "react";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deactivateUserAction } from "@/lib/actions/users";

export type UserRow = { id: string; username: string; name: string; role: string; email: string; isActive: boolean; isSelf: boolean };

/** Tableau des utilisateurs avec recherche instantanée sur toutes les colonnes (RG7). */
export function UsersTable({ rows }: { rows: UserRow[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => [r.username, r.name, r.role, r.email].some((v) => v.toLowerCase().includes(q)));
  }, [rows, query]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <Input type="search" aria-label="Rechercher" placeholder="Rechercher" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
      </div>
      <div className="overflow-x-auto rounded-[1.25rem] border border-line bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-sunken text-xs uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Nom d&apos;utilisateur</th>
              <th scope="col" className="px-4 py-3 font-semibold">Nom</th>
              <th scope="col" className="px-4 py-3 font-semibold">Rôle</th>
              <th scope="col" className="px-4 py-3 font-semibold">E-mail</th>
              <th scope="col" className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((row) => <Row key={row.id} row={row} />)}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted" aria-live="polite">
        {filtered.length} sur {rows.length} utilisateur(s){query ? " (filtré)" : ""}
      </p>
    </div>
  );
}

function Row({ row }: { row: UserRow }) {
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
    <tr className={row.isActive ? undefined : "text-muted"}>
      <td className="px-4 py-3 font-medium">{row.username}</td>
      <td className="px-4 py-3">{row.name}{row.isActive ? null : <span className="ml-2 rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">Inactif</span>}</td>
      <td className="px-4 py-3">{row.role}</td>
      <td className="px-4 py-3">{row.email}</td>
      <td className="px-4 py-2">
        {confirming ? (
          <span className="flex gap-2">
            <Button size="sm" variant="danger" onClick={erase} disabled={pending}>Confirmer</Button>
            <Button size="sm" variant="secondary" onClick={() => setConfirming(false)}>Annuler</Button>
          </span>
        ) : (
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
        )}
      </td>
    </tr>
  );
}
