import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { loadEmails } from "@/lib/admin";
import { requirePlatformAdmin } from "@/lib/platform";
import { EmailsTable } from "./emails-table";

export const metadata: Metadata = { title: "E-mails", robots: { index: false } };

const EMAIL_LABELS: Record<string, string> = {
  welcome: "Bienvenue",
  email_verification: "Confirmation d'adresse",
  password_reset: "Réinitialisation",
  password_changed: "Mot de passe modifié",
  invoice: "Facture",
};

/** Journal des envois de toute la plateforme (métadonnées uniquement, jamais de contenu ni de secret). */
export default async function AdminEmailsPage() {
  await requirePlatformAdmin();
  const emails = await loadEmails(250);
  const delivered = emails.filter((email) => email.status === "delivered").length;
  const failed = emails.filter((email) => email.status === "failed" || email.status === "bounced").length;

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">
              <Mail className="size-6 text-spark" aria-hidden />
              E-mails
            </h1>
            <p className="mt-1 text-muted">
              Les {emails.length} derniers envois journalisés, toutes entreprises confondues.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="moss">{delivered} livré(s)</Badge>
            {failed ? <Badge tone="danger">{failed} en échec</Badge> : <Badge tone="neutral">Aucun échec</Badge>}
          </div>
        </div>
      </Reveal>

      <EmailsTable emails={emails} typeLabels={EMAIL_LABELS} />
    </div>
  );
}
