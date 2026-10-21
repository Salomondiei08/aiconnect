import type { Metadata } from "next";
import Link from "next/link";
import { Building2, ScrollText, UserRound } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadPlatformActions } from "@/lib/admin";
import { PLATFORM_ACTION_LABELS, platformAdminEmails, requirePlatformAdmin } from "@/lib/platform";
import { formatDateTime, formatRelative } from "@/lib/utils";

export const metadata: Metadata = { title: "Journal plateforme", robots: { index: false } };

const ACTION_TONES: Record<string, "moss" | "danger" | "ochre" | "spark" | "neutral"> = {
  company_suspended: "danger",
  company_reactivated: "moss",
  user_activated: "moss",
  user_deactivated: "ochre",
  platform_admin_granted: "spark",
  platform_admin_revoked: "ochre",
  sessions_revoked: "neutral",
};

/** Journal des actions de super-admins : qui a fait quoi, sur quelle entreprise ou quel compte. */
export default async function AdminJournalPage() {
  const admin = await requirePlatformAdmin();
  const entries = await loadPlatformActions(150);
  const bootstrapEmails = platformAdminEmails();

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">
              <ScrollText className="size-6 text-spark" aria-hidden />
              Journal plateforme
            </h1>
            <p className="mt-1 text-muted">
              Chaque suspension, réactivation, droit accordé ou session fermée est tracé ici.
            </p>
          </div>
          <Badge tone="brand">{entries.length} entrée(s)</Badge>
        </div>
      </Reveal>

      <Reveal>
        <Card>
          <CardHeader>
            <CardTitle>Accès plateforme</CardTitle>
            <p className="mt-1 text-sm text-muted">
              Le droit vient de la base (<span className="tabular">User.platformRole</span>) ou de la liste d&apos;amorçage{" "}
              <span className="tabular">PLATFORM_ADMIN_EMAILS</span>.
            </p>
          </CardHeader>
          <CardContent>
            {bootstrapEmails.length ? (
              <ul className="flex flex-wrap gap-2">
                {bootstrapEmails.map((email) => (
                  <li key={email}>
                    <Badge tone={email === admin.email ? "spark" : "neutral"}>
                      {email}
                      {email === admin.email ? " · vous" : ""}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">
                Aucune adresse d&apos;amorçage configurée : les super-admins sont ceux enregistrés en base.
              </p>
            )}
          </CardContent>
        </Card>
      </Reveal>

      <Reveal delay={70}>
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            {entries.length ? (
              <ol className="relative space-y-1 border-l border-line pl-5">
                {entries.map((entry) => (
                  <li key={entry.id} className="relative py-3">
                    <span
                      aria-hidden
                      className="absolute -left-[1.65rem] top-5 grid size-3 place-items-center rounded-full border-2 border-surface bg-spark-fill"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge tone={ACTION_TONES[entry.action] ?? "neutral"} size="sm">
                          {PLATFORM_ACTION_LABELS[entry.action] ?? entry.action}
                        </Badge>
                        <span className="font-medium">{entry.actorEmail}</span>
                      </p>
                      <span className="text-xs text-muted" title={formatDateTime(entry.createdAt)}>
                        {formatRelative(entry.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        {entry.targetType === "company" ? <Building2 className="size-3.5" aria-hidden /> : <UserRound className="size-3.5" aria-hidden />}
                        {entry.targetType === "company" ? "Entreprise" : "Compte"}
                      </span>
                      {entry.companyId ? (
                        <Link href={`/admin/entreprises/${entry.companyId}`} className="font-semibold hover:text-spark hover:underline">
                          Ouvrir la fiche
                        </Link>
                      ) : null}
                      {entry.targetId ? <span className="tabular">id {entry.targetId.slice(0, 12)}…</span> : null}
                      {entry.details ? <span className="tabular truncate max-w-72" title={JSON.stringify(entry.details)}>{JSON.stringify(entry.details)}</span> : null}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted">
                Aucune action enregistrée pour l&apos;instant. Suspendez une entreprise ou accordez un droit super-admin : l&apos;entrée
                apparaîtra ici.
              </p>
            )}
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}
