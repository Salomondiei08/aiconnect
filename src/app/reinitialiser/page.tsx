import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { FormNotice } from "@/components/form-field";
import { isResetTokenUsable } from "@/lib/accounts";
import { INVALID_LINK } from "@/lib/actions/form";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  const usable = await isResetTokenUsable(token);
  return (
    <AuthShell title="Choisir un nouveau mot de passe">
      {usable ? (
        <ResetForm token={token} />
      ) : (
        <div className="space-y-4">
          <FormNotice tone="error">{INVALID_LINK}</FormNotice>
          <Link href="/mot-de-passe-oublie" className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline-offset-4 hover:underline">
            Demander un nouveau lien
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
