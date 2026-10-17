import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Inscription" };

export default function SignupPage() {
  return (
    <AuthShell title="Créer votre espace" subtitle="Trois étapes, moins de deux minutes. Gratuit pour démarrer.">
      <SignupForm />
      <p className="mt-6 text-sm text-muted">
        Déjà inscrit ? <Link href="/connexion" className="font-semibold text-link underline-offset-4 hover:underline">Se connecter</Link>
      </p>
    </AuthShell>
  );
}
