import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ motdepasse?: string }> }) {
  if (await getCurrentUser()) redirect("/tableau-de-bord");
  const { motdepasse } = await searchParams;
  return (
    <AuthShell title="Se connecter" subtitle="Avec le nom d'utilisateur choisi à l'inscription.">
      <LoginForm notice={motdepasse === "modifie" ? "Mot de passe modifié. Connectez-vous avec le nouveau." : undefined} />
      <p className="mt-6 text-sm text-muted">
        Pas encore de compte ? <Link href="/inscription" className="font-semibold text-link underline-offset-4 hover:underline">S&apos;inscrire</Link>
      </p>
    </AuthShell>
  );
}
