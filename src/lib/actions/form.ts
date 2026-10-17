/** Résultat d'action : erreurs par champ, message global, et valeurs saisies (hors mots de passe) pour les réafficher. */
export type FormState = { errors?: Record<string, string>; message?: string; success?: string; values?: Record<string, string> };

/** Valeurs à réafficher après une erreur : jamais les mots de passe. */
export function keepValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData) if (typeof v === "string" && !/password|confirm|pin/i.test(k)) out[k] = v;
  return out;
}

export const INVALID_LINK = "Lien invalide ou expiré. Demandez un nouveau lien.";
