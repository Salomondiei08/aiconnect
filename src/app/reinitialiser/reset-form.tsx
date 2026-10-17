"use client";

import { useActionState } from "react";
import { FormField, FormNotice } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPasswordAction } from "@/lib/actions/auth";
import type { FormState } from "@/lib/actions/form";

export function ResetForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(resetPasswordAction, {});
  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.message ? <FormNotice tone="error">{state.message}</FormNotice> : null}
      <input type="hidden" name="token" value={token} />
      <FormField id="password" label="Nouveau mot de passe" required hint="8 caractères minimum, une majuscule, un chiffre et un symbole" error={state.errors?.password}>
        <Input id="password" name="password" type="password" required autoComplete="new-password" />
      </FormField>
      <FormField id="confirm" label="Confirmation du mot de passe" required error={state.errors?.confirm}>
        <Input id="confirm" name="confirm" type="password" required autoComplete="new-password" />
      </FormField>
      <Button type="submit" disabled={pending}>{pending ? "Enregistrement..." : "Enregistrer"}</Button>
    </form>
  );
}
