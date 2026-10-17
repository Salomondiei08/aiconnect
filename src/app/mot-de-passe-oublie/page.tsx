import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Mot de passe oublié" subtitle="Indiquez l'adresse e-mail de votre compte : nous vous envoyons un lien valable 1 heure.">
      <ForgotForm />
      <p className="mt-6 text-sm text-muted">
        <Link href="/connexion" className="font-semibold text-link underline-offset-4 hover:underline">Retour à la connexion</Link>
      </p>
    </AuthShell>
  );
}
