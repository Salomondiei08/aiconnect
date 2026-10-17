"use client";

import Link from "next/link";
import { useActionState } from "react";
import { FormField, FormNotice } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/lib/actions/auth";
import type { FormState } from "@/lib/actions/form";

export function LoginForm({ notice }: { notice?: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <form action={formAction} className="space-y-4">
      {state.message ? <FormNotice tone="error">{state.message}</FormNotice> : notice ? <FormNotice tone="success">{notice}</FormNotice> : null}
      <FormField id="username" label="Nom d'utilisateur">
        <Input id="username" name="username" required autoComplete="username" autoCapitalize="none" defaultValue={state.values?.username} />
      </FormField>
      <FormField id="password" label="Mot de passe">
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </FormField>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/mot-de-passe-oublie" className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline-offset-4 hover:underline">
          Mot de passe oublié ?
        </Link>
        <Button type="submit" disabled={pending}>{pending ? "Connexion..." : "Se connecter"}</Button>
      </div>
    </form>
  );
}
