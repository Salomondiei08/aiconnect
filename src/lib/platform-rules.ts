/**
 * Règles d'accès de l'espace plateforme, pures et testables sans base ni session.
 * Le module serveur (`./platform`) les applique ; les tests unitaires les vérifient directement.
 */

export const PLATFORM_ADMIN = "platform_admin";

/** Adresses d'amorçage : une liste brute devient une liste normalisée, sans vide ni doublon. */
export function parsePlatformAdminEmails(raw: string | undefined | null): string[] {
  return [...new Set((raw ?? "").split(/[,\s;]+/).map((email) => email.trim().toLowerCase()).filter(Boolean))];
}

type PlatformUser = { email: string; platformRole: string | null };

/**
 * Un compte est super-admin s'il porte le rôle plateforme en base ou s'il figure dans la liste d'amorçage.
 * La comparaison ignore la casse ; un rôle différent de `platform_admin` ne donne rien.
 */
export function hasPlatformAccess(user: PlatformUser, bootstrapEmails: string[] = []): boolean {
  if (user.platformRole === PLATFORM_ADMIN) return true;
  return bootstrapEmails.includes(user.email.trim().toLowerCase());
}

/** Le droit doit-il être écrit en base à la connexion ? (liste d'amorçage, rôle absent) */
export function needsPlatformRoleSync(user: PlatformUser, bootstrapEmails: string[] = []): boolean {
  if (user.platformRole === PLATFORM_ADMIN) return false;
  return bootstrapEmails.includes(user.email.trim().toLowerCase());
}

/**
 * Garde-fous des actions plateforme : une suspension/réactivation ne peut porter que sur
 * les deux états connus, et personne ne peut retirer son propre droit (verrouillage assuré).
 */
export type CompanyStatus = "active" | "suspended";

export function isCompanyStatus(value: string): value is CompanyStatus {
  return value === "active" || value === "suspended";
}

export function canRevokeOwnPlatformRole(actorId: string, targetId: string): boolean {
  return actorId !== targetId;
}

/** Libellé français des actions du journal, partagé par l'affichage et les exports. */
export const PLATFORM_ACTION_LABELS: Record<string, string> = {
  company_suspended: "Entreprise suspendue",
  company_reactivated: "Entreprise réactivée",
  user_activated: "Compte réactivé",
  user_deactivated: "Compte désactivé",
  platform_admin_granted: "Droit super-admin accordé",
  platform_admin_revoked: "Droit super-admin retiré",
  sessions_revoked: "Sessions fermées",
};

export function platformActionLabel(action: string): string {
  return PLATFORM_ACTION_LABELS[action] ?? action;
}
