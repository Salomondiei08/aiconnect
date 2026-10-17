import { z } from "zod";

export const PASSWORD_RULE_MESSAGE =
  "Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial";

/** RG3 : 8 caractères minimum, une majuscule, un chiffre, un caractère spécial. */
export const passwordSchema = z
  .string()
  .min(8, PASSWORD_RULE_MESSAGE)
  .regex(/[A-Z]/, PASSWORD_RULE_MESSAGE)
  .regex(/\d/, PASSWORD_RULE_MESSAGE)
  .regex(/[^A-Za-z0-9]/, PASSWORD_RULE_MESSAGE);

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9._-]{3,50}$/, "3 à 50 caractères : lettres, chiffres, point, tiret ou tiret bas, sans espace");

export const emailSchema = z.string().trim().toLowerCase().email("Adresse e-mail invalide").max(150);

export const ROLES = ["Admin", "Gérant", "Caissier", "Comptable", "RH"] as const;
export type Role = (typeof ROLES)[number];

/** Premier message d'erreur par champ, pour l'afficher sous le champ concerné. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

/** RG2 : identifiant tiré du prénom, rendu unique par un suffixe numérique. */
export function baseUsername(firstName: string): string {
  const base = firstName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 30);
  return base.length >= 3 ? base : `${base}user`;
}
