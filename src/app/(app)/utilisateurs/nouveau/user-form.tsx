"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FormField, FormNotice } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { createUserAction, updateUserAction } from "@/lib/actions/users";
import type { FormState } from "@/lib/actions/form";
import { ROLES } from "@/lib/validation";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-[1.25rem] border border-line bg-surface p-5 sm:p-6">
      <legend className="sr-only">{title}</legend>
      <h2 className="mb-4 font-semibold">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function CheckField({ id, name, label, checked, onChange, value }: { id: string; name: string; label: string; checked: boolean; onChange: (v: boolean) => void; value?: string }) {
  return (
    <div className="flex min-h-11 items-center gap-3">
      <Checkbox id={id} name={name} value={value} checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <Label htmlFor={id} className="font-medium">{label}</Label>
    </div>
  );
}

export type EditableUser = {
  id: string;
  prefix: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  role: string;
  isActive: boolean;
  canLogin: boolean;
  allLocations: boolean;
  locationIds: string[];
};

/**
 * « Ajouter un utilisateur » et « Modifier » : blocs 1 à 3 du cahier des charges, un seul bouton Sauvegarder.
 * En modification, les champs sont préremplis et un mot de passe vide garde l'actuel.
 */
export function UserForm({ locations, user }: { locations: { id: string; name: string; code: string }[]; user?: EditableUser }) {
  const router = useRouter();
  const editing = !!user;
  const [state, formAction, pending] = useActionState<FormState, FormData>(editing ? updateUserAction.bind(null, user.id) : createUserAction, {});
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [canLogin, setCanLogin] = useState(user?.canLogin ?? true);
  const [allLocations, setAllLocations] = useState(user?.allLocations ?? true);
  const [picked, setPicked] = useState<string[]>(user?.locationIds ?? []);
  const errors = state.errors ?? {};
  // Après une erreur, on réaffiche la saisie ; sinon les valeurs actuelles de l'utilisateur.
  const initial: Record<string, string> = user
    ? { prefix: user.prefix, firstName: user.firstName, lastName: user.lastName, email: user.email, username: user.username, role: user.role }
    : {};
  const values = state.values ?? initial;

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      router.push(editing ? `/utilisateurs/${user.id}` : "/utilisateurs");
    } else if (state.errors) {
      // Amène la première erreur à l'écran (le formulaire est long sur téléphone).
      document.querySelector('[role="alert"]')?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [state, router, editing, user?.id]);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.message ? <FormNotice tone="error">{state.message}</FormNotice> : null}
      <Block title="Informations personnelles">
        <FormField id="prefix" label="Préfixe">
          <NativeSelect id="prefix" name="prefix" defaultValue={values.prefix ?? ""}>
            <option value="">Aucun</option>
            <option>M</option>
            <option>Mme</option>
            <option>Mlle</option>
          </NativeSelect>
        </FormField>
        <FormField id="firstName" label="Prénom" required error={errors.firstName}>
          <Input id="firstName" name="firstName" maxLength={100} defaultValue={values.firstName} aria-invalid={!!errors.firstName} />
        </FormField>
        <FormField id="lastName" label="Nom de famille">
          <Input id="lastName" name="lastName" maxLength={100} defaultValue={values.lastName} />
        </FormField>
        <FormField id="email" label="E-mail" required error={errors.email}>
          <Input id="email" name="email" type="email" maxLength={150} defaultValue={values.email} aria-invalid={!!errors.email} />
        </FormField>
        <CheckField id="isActive" name="isActive" label="Est actif" checked={isActive} onChange={setIsActive} />
      </Block>

      <Block title="Rôles et autorisations">
        <div className="sm:col-span-2">
          <CheckField id="canLogin" name="canLogin" label="Autoriser la connexion" checked={canLogin} onChange={setCanLogin} />
          {!canLogin ? <p className="text-[13px] text-muted">Membre du personnel sans accès à l&apos;application.</p> : null}
        </div>
        {canLogin ? (
          <>
            <FormField id="username" label="Nom d'utilisateur" hint={editing ? undefined : "Laisser vide pour le générer à partir du prénom"} error={errors.username}>
              <Input id="username" name="username" maxLength={50} autoCapitalize="none" autoComplete="off" defaultValue={values.username} aria-invalid={!!errors.username} />
            </FormField>
            <div className="hidden sm:block" />
            <FormField id="password" label="Mot de passe" required={!editing} hint={editing ? "Laisser vide pour garder le mot de passe actuel" : undefined} error={errors.password}>
              <Input id="password" name="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password} />
            </FormField>
            <FormField id="confirm" label="Confirmez le mot de passe" required={!editing} error={errors.confirm}>
              <Input id="confirm" name="confirm" type="password" autoComplete="new-password" aria-invalid={!!errors.confirm} />
            </FormField>
          </>
        ) : null}
        <FormField id="role" label="Rôle" required hint="Le rôle détermine les permissions" error={errors.role}>
          <NativeSelect id="role" name="role" defaultValue={values.role ?? ""}>
            <option value="" disabled>Choisir un rôle</option>
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </NativeSelect>
        </FormField>
      </Block>

      <Block title="Accès aux lieux">
        <div className="space-y-2 sm:col-span-2">
          <CheckField id="allLocations" name="allLocations" label="Tous les emplacements" checked={allLocations} onChange={setAllLocations} />
          {!allLocations
            ? locations.map((l) => (
                <CheckField
                  key={l.id}
                  id={`loc-${l.id}`}
                  name="locationIds"
                  value={l.id}
                  label={`${l.name} (${l.code})`}
                  checked={picked.includes(l.id)}
                  onChange={(on) => setPicked((p) => (on ? [...p, l.id] : p.filter((x) => x !== l.id)))}
                />
              ))
            : null}
          {errors.locationIds ? <p role="alert" className="text-[13px] font-medium text-danger">{errors.locationIds}</p> : null}
        </div>
      </Block>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>{pending ? "Enregistrement..." : "Sauvegarder"}</Button>
      </div>
    </form>
  );
}
