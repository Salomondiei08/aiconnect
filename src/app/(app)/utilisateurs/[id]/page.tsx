import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ACTIVITY_LABELS } from "@/lib/activity";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { can } from "@/lib/roles";
import { UserPicker } from "./user-picker";

export const metadata: Metadata = { title: "Voir l'utilisateur" };

const dateTime = new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Abidjan", dateStyle: "short", timeStyle: "short" });

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

/** Fiche en lecture seule (RG-V1) : profil, informations, journal d'activité. Mot de passe jamais affiché (RG-V3). */
export default async function ViewUserPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireUser();
  if (!can.manageUsers(admin)) redirect("/tableau-de-bord");
  const { id } = await params;
  const [user, everyone] = await Promise.all([
    db.user.findFirst({
      where: { id, companyId: admin.companyId },
      include: {
        locations: { include: { location: true } },
        activities: { orderBy: { createdAt: "desc" }, take: 50, include: { actor: { select: { username: true } } } },
      },
    }),
    db.user.findMany({ where: { companyId: admin.companyId }, select: { id: true, username: true, firstName: true, lastName: true }, orderBy: { username: "asc" } }),
  ]);

  if (!user) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-[1.75rem] font-semibold">Utilisateur introuvable</h1>
        <Link href="/utilisateurs" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-link"><ArrowLeft className="size-4" aria-hidden /> Retour à la liste</Link>
      </div>
    );
  }

  const fullName = [user.prefix, user.firstName, user.lastName].filter(Boolean).join(" ");
  const initials = `${user.firstName[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/utilisateurs" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-link"><ArrowLeft className="size-4" aria-hidden /> Utilisateurs</Link>
          <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">Voir l&apos;utilisateur</h1>
        </div>
        <UserPicker current={user.id} users={everyone.map((u) => ({ id: u.id, label: `${u.username} · ${[u.firstName, u.lastName].filter(Boolean).join(" ")}` }))} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <section aria-label="Profil" className="h-fit rounded-[1.25rem] border border-line bg-surface p-5 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-spark-soft text-xl font-semibold text-spark" aria-hidden>{initials}</span>
          <p className="mt-3 font-semibold">{fullName}</p>
          <p className="text-sm text-muted">{user.role}</p>
          <dl className="mt-4 divide-y divide-line text-left">
            <Item label="Nom d'utilisateur">{user.username}</Item>
            <Item label="E-mail"><a href={`mailto:${user.email}`} className="text-link break-all">{user.email}</a></Item>
            <Item label="Statut">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${user.isActive ? "bg-moss-soft text-moss" : "bg-danger-soft text-danger"}`}>{user.isActive ? "Actif" : "Inactif"}</span>
            </Item>
          </dl>
          <ButtonLink href={`/utilisateurs/${user.id}/modifier`} className="mt-4 w-full"><Pencil aria-hidden /> Modifier</ButtonLink>
        </section>

        <div className="space-y-6">
          <section className="rounded-[1.25rem] border border-line bg-surface p-5">
            <h2 className="font-semibold">Informations de l&apos;utilisateur</h2>
            <dl className="mt-2 divide-y divide-line">
              <Item label="Autoriser la connexion">{user.canLogin ? "Oui" : "Non"}</Item>
              <Item label="Adresse e-mail confirmée">{user.emailVerifiedAt ? "Oui" : "Non"}</Item>
              <Item label="Emplacements">{user.allLocations ? "Tous les lieux" : user.locations.map((l) => `${l.location.name} (${l.location.code})`).join(", ") || "—"}</Item>
              <Item label="Dernière connexion">{user.lastLoginAt ? dateTime.format(user.lastLoginAt) : "—"}</Item>
              <Item label="Créé le">{dateTime.format(user.createdAt)}</Item>
            </dl>
          </section>

          <section className="rounded-[1.25rem] border border-line bg-surface p-5">
            <h2 className="font-semibold">Activités</h2>
            {user.activities.length ? (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th scope="col" className="py-2 pr-4 font-semibold">Date</th>
                      <th scope="col" className="py-2 pr-4 font-semibold">Action</th>
                      <th scope="col" className="py-2 pr-4 font-semibold">Effectué par</th>
                      <th scope="col" className="py-2 font-semibold">Détails</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {user.activities.map((a) => (
                      <tr key={a.id}>
                        <td className="py-2 pr-4 tabular whitespace-nowrap">{dateTime.format(a.createdAt)}</td>
                        <td className="py-2 pr-4">{ACTIVITY_LABELS[a.action] ?? a.action}</td>
                        <td className="py-2 pr-4">{a.actor?.username ?? "—"}</td>
                        <td className="py-2 text-muted">
                          {a.details
                            ? Object.entries(a.details as Record<string, [unknown, unknown]>)
                                .map(([field, [from, to]]) => `${field} : ${String(from ?? "—")} → ${String(to ?? "—")}`)
                                .join(" ; ")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">Aucune activité enregistrée.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
