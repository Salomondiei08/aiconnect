import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { FormNotice } from "@/components/form-field";
import { logActivity } from "@/lib/activity";
import { consumeVerificationToken } from "@/lib/email-verification";

export const metadata: Metadata = { title: "Confirmation d'adresse", robots: { index: false } };

/** Lien reçu par e-mail : confirme l'adresse une seule fois. */
export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const user = await consumeVerificationToken(token);
  if (user) await logActivity({ companyId: user.companyId, targetId: user.id, actorId: user.id, action: "email_verified" });
  return (
    <AuthShell title={user ? "Adresse e-mail confirmée" : "Lien invalide ou expiré"}>
      <div className="space-y-4">
        {user ? (
          <FormNotice tone="success">Merci {user.firstName}, votre adresse {user.email} est confirmée.</FormNotice>
        ) : (
          <FormNotice tone="error">Ce lien a déjà servi ou a expiré. Depuis votre tableau de bord, demandez un nouveau lien.</FormNotice>
        )}
        <Link href="/tableau-de-bord" className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline-offset-4 hover:underline">
          Aller au tableau de bord
        </Link>
      </div>
    </AuthShell>
  );
}
