"use client";

import { useState, useTransition } from "react";
import { MailWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resendVerificationAction } from "@/lib/actions/auth";

/**
 * Rappel tant que l'adresse n'est pas confirmée, avec renvoi du lien.
 * Texte et rôles inchangés : le bandeau reste lisible par les tests d'acceptation 09.
 */
export function VerifyBanner({ email }: { email: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div
      role="status"
      className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-ochre/25 bg-ochre-soft p-4 text-sm text-ochre shadow-[var(--shadow-xs)] sm:flex-row sm:items-center sm:justify-between animate-fade-up"
    >
      <span className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-ochre/70" aria-hidden />
      <p className="flex items-start gap-2.5">
        <MailWarning className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>{message ?? `Confirmez votre adresse e-mail (${email}) avec le lien reçu à l'inscription.`}</span>
      </p>
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        className="shrink-0 border-ochre/30 bg-surface text-ochre hover:bg-sunken"
        onClick={() => startTransition(async () => setMessage((await resendVerificationAction()).message))}
      >
        {pending ? "Envoi..." : "Renvoyer le lien"}
      </Button>
    </div>
  );
}
