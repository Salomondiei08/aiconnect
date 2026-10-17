"use client";

import { useActionState, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { signupAction } from "@/lib/actions/auth";
import type { FormState } from "@/lib/actions/form";

const STEPS = ["Entreprise", "Paramètres", "Propriétaire"] as const;
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const COUNTRIES = ["Côte d'Ivoire", "Sénégal", "Mali", "Burkina Faso", "Bénin", "Togo", "Niger", "Guinée", "Cameroun", "Gabon", "Congo", "Tchad", "Centrafrique", "Guinée-Bissau", "Guinée équatoriale", "Comores", "RD Congo"];
const TIMEZONES = ["Africa/Abidjan", "Africa/Dakar", "Africa/Bamako", "Africa/Ouagadougou", "Africa/Lome", "Africa/Porto-Novo", "Africa/Niamey", "Africa/Conakry", "Africa/Douala", "Africa/Libreville", "Africa/Brazzaville", "Africa/Ndjamena", "Africa/Kinshasa"];

/** Les champs des étapes 1 et 2, gardés en mémoire pendant qu'on avance. */
type Draft = Record<string, string>;

/**
 * Inscription en 3 étapes : une seule étape dans le DOM à la fois, chaque étape validée par le navigateur
 * avant d'avancer, l'ensemble validé à nouveau côté serveur à la fin.
 */
export function SignupForm() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({ currency: "XOF", country: "Côte d'Ivoire", timezone: "Africa/Abidjan", fiscalYearStartMonth: "1", stockMethod: "FIFO" });
  const [state, formAction, pending] = useActionState<FormState, FormData>(signupAction, {});
  const errors = state.errors ?? {};

  function next(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Draft;
    setDraft((d) => ({ ...d, ...values }));
    setStep((s) => s + 1);
  }

  const v = (name: string) => draft[name] ?? "";
  // Une erreur serveur sur une étape précédente reste visible en tête de l'étape 3.
  const earlierErrors = Object.entries(errors).filter(([k]) => !["firstName", "lastName", "username", "email", "password", "confirm"].includes(k));

  return (
    <div>
      <ol className="mb-6 flex gap-2 text-xs font-medium" aria-label="Étapes de l'inscription">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === step ? "step" : undefined} className={`flex-1 rounded-full px-3 py-2 text-center ${i === step ? "bg-brand text-on-brand" : i < step ? "bg-spark-soft text-spark" : "bg-sunken text-muted"}`}>
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <form onSubmit={next} className="grid gap-4 sm:grid-cols-2" key="step-1">
          <FormField id="company" label="Nom de l'entreprise" required hint="Tel qu'il doit figurer sur les factures" className="sm:col-span-2">
            <Input id="company" name="company" required maxLength={150} defaultValue={v("company")} autoComplete="organization" />
          </FormField>
          <FormField id="currency" label="Devise" required hint="Difficile à changer ensuite : vérifiez-la">
            <NativeSelect id="currency" name="currency" defaultValue={v("currency")}>
              <option value="XOF">Franc CFA BCEAO (XOF)</option>
              <option value="XAF">Franc CFA BEAC (XAF)</option>
            </NativeSelect>
          </FormField>
          <FormField id="country" label="Pays" required>
            <NativeSelect id="country" name="country" defaultValue={v("country")}>
              {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
            </NativeSelect>
          </FormField>
          <FormField id="commune" label="Commune" required>
            <Input id="commune" name="commune" required maxLength={100} defaultValue={v("commune")} />
          </FormField>
          <FormField id="city" label="Ville" required>
            <Input id="city" name="city" required maxLength={100} defaultValue={v("city")} autoComplete="address-level2" />
          </FormField>
          <FormField id="postalCode" label="Code postal" required hint="Pas de code postal : saisissez 00000 ou votre BP">
            <Input id="postalCode" name="postalCode" required maxLength={20} defaultValue={v("postalCode")} />
          </FormField>
          <FormField id="timezone" label="Fuseau horaire" required>
            <NativeSelect id="timezone" name="timezone" defaultValue={v("timezone")}>
              {TIMEZONES.map((t) => <option key={t}>{t}</option>)}
            </NativeSelect>
          </FormField>
          <FormField id="landmark" label="Point de repère" required hint="Exemple : près de la pharmacie du marché" className="sm:col-span-2">
            <Input id="landmark" name="landmark" required maxLength={200} defaultValue={v("landmark")} />
          </FormField>
          <FormField id="startDate" label="Date de début">
            <Input id="startDate" name="startDate" type="date" defaultValue={v("startDate")} />
          </FormField>
          <FormField id="phone" label="Numéro de contact professionnel">
            <Input id="phone" name="phone" type="tel" maxLength={30} defaultValue={v("phone")} autoComplete="tel" />
          </FormField>
          <FormField id="website" label="Site Internet" className="sm:col-span-2">
            <Input id="website" name="website" type="url" maxLength={200} defaultValue={v("website")} placeholder="https://" />
          </FormField>
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit">Suivant <ArrowRight aria-hidden /></Button>
          </div>
        </form>
      ) : null}

      {step === 1 ? (
        <form onSubmit={next} className="grid gap-4 sm:grid-cols-2" key="step-2">
          <FormField id="fiscalYearStartMonth" label="Mois de début d'année financière" required>
            <NativeSelect id="fiscalYearStartMonth" name="fiscalYearStartMonth" defaultValue={v("fiscalYearStartMonth")}>
              {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </NativeSelect>
          </FormField>
          <FormField id="stockMethod" label="Méthode comptable" required hint="Valeur attribuée au stock vendu">
            <NativeSelect id="stockMethod" name="stockMethod" defaultValue={v("stockMethod")}>
              <option value="FIFO">FIFO (premier entré, premier sorti)</option>
              <option value="CMUP">Coût moyen pondéré</option>
            </NativeSelect>
          </FormField>
          <FormField id="tax1Name" label="Nom de taxe 1" hint="Exemple : TVA">
            <Input id="tax1Name" name="tax1Name" maxLength={50} defaultValue={v("tax1Name")} />
          </FormField>
          <FormField id="tax1Number" label="N° de taxe 1" hint="Exemple : numéro de compte contribuable (NCC)">
            <Input id="tax1Number" name="tax1Number" maxLength={50} defaultValue={v("tax1Number")} />
          </FormField>
          <div className="flex justify-between gap-3 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setStep(0)}><ArrowLeft aria-hidden /> Précédent</Button>
            <Button type="submit">Suivant <ArrowRight aria-hidden /></Button>
          </div>
        </form>
      ) : null}

      {step === 2 ? (
        <form action={formAction} className="grid gap-4 sm:grid-cols-2" key="step-3" noValidate>
          {Object.entries(draft).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
          {earlierErrors.length ? (
            <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger sm:col-span-2">
              {earlierErrors.map(([, m]) => m).join(" · ")}
            </p>
          ) : null}
          <FormField id="firstName" label="Prénom" required error={errors.firstName}>
            <Input id="firstName" name="firstName" defaultValue={state.values?.firstName} required maxLength={100} autoComplete="given-name" aria-invalid={!!errors.firstName} />
          </FormField>
          <FormField id="lastName" label="Nom">
            <Input id="lastName" name="lastName" defaultValue={state.values?.lastName} maxLength={100} autoComplete="family-name" />
          </FormField>
          <FormField id="username" label="Nom d'utilisateur" required hint="Pour vous connecter : simple, sans espace" error={errors.username}>
            <Input id="username" name="username" defaultValue={state.values?.username} required maxLength={50} autoComplete="username" autoCapitalize="none" aria-invalid={!!errors.username} />
          </FormField>
          <FormField id="email" label="E-mail" required hint="Pour récupérer votre mot de passe" error={errors.email}>
            <Input id="email" name="email" defaultValue={state.values?.email} type="email" required maxLength={150} autoComplete="email" aria-invalid={!!errors.email} />
          </FormField>
          <FormField id="password" label="Mot de passe" required hint="8 caractères minimum, une majuscule, un chiffre et un symbole" error={errors.password}>
            <Input id="password" name="password" type="password" required autoComplete="new-password" aria-invalid={!!errors.password} />
          </FormField>
          <FormField id="confirm" label="Confirmation du mot de passe" required error={errors.confirm}>
            <Input id="confirm" name="confirm" type="password" required autoComplete="new-password" aria-invalid={!!errors.confirm} />
          </FormField>
          <div className="flex justify-between gap-3 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}><ArrowLeft aria-hidden /> Précédent</Button>
            <Button type="submit" variant="spark" disabled={pending}>{pending ? "Création..." : "S'inscrire"}</Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
