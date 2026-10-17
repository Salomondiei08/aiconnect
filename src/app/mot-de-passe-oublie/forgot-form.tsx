"use client";

import { useActionState } from "react";
import { FormField, FormNotice } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { forgotPasswordAction } from "@/lib/actions/auth";
import type { FormState } from "@/lib/actions/form";

export function ForgotForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(forgotPasswordAction, {});
  if (state.success) return <FormNotice tone="success">{state.success}</FormNotice>;
  return (
    <form action={formAction} className="space-y-4">
      <FormField id="email" label="E-mail" error={state.errors?.email}>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </FormField>
      <Button type="submit" disabled={pending}>{pending ? "Envoi..." : "Envoyer le lien"}</Button>
    </form>
  );
}
