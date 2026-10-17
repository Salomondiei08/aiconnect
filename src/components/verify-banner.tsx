"use client";

import { useState, useTransition } from "react";
import { MailWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resendVerificationAction } from "@/lib/actions/auth";

/** Rappel tant que l'adresse n'est pas confirmée, avec renvoi du lien. */
export function VerifyBanner({ email }: { email: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div role="status" className="flex flex-col gap-3 rounded-[1.25rem] bg-ochre-soft p-4 text-sm text-ochre sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2">
        <MailWarning className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>{message ?? `Confirmez votre adresse e-mail (${email}) avec le lien reçu à l'inscription.`}</span>
      </p>
      <Button size="sm" variant="secondary" disabled={pending} onClick={() => startTransition(async () => setMessage((await resendVerificationAction()).message))}>
        {pending ? "Envoi..." : "Renvoyer le lien"}
      </Button>
    </div>
  );
}
