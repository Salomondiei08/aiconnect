import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Prisma, User } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser, type SessionUser } from "@/lib/auth/session";
import { hasPlatformAccess, needsPlatformRoleSync, parsePlatformAdminEmails, PLATFORM_ADMIN } from "./platform-rules";

export { PLATFORM_ACTION_LABELS, PLATFORM_ADMIN } from "./platform-rules";

/**
 * Espace plateforme : un super-admin voit toutes les entreprises (au-dessus de l'isolation par société).
 * L'accès vient de la base (`User.platformRole`) ou de la liste d'amorçage `PLATFORM_ADMIN_EMAILS`,
 * qui permet au porteur du projet de reprendre la main sans accès direct à la base.
 */

/** Adresses autorisées par l'environnement, normalisées. */
export function platformAdminEmails(): string[] {
  return parsePlatformAdminEmails(process.env.PLATFORM_ADMIN_EMAILS);
}

/** Un compte est super-admin s'il porte le rôle plateforme ou s'il figure dans la liste d'amorçage. */
export function isPlatformAdmin(user: Pick<User, "email" | "platformRole">): boolean {
  return hasPlatformAccess(user, platformAdminEmails());
}

/**
 * Applique la liste d'amorçage en base : appelé à la connexion, une seule écriture si nécessaire.
 * Retirer une adresse de `PLATFORM_ADMIN_EMAILS` ne retire pas le rôle déjà accordé :
 * la révocation se fait dans l'espace plateforme, où elle est journalisée.
 */
export async function syncPlatformRole(user: Pick<User, "id" | "email" | "platformRole">): Promise<void> {
  if (!needsPlatformRoleSync(user, platformAdminEmails())) return;
  await db.user.update({ where: { id: user.id }, data: { platformRole: PLATFORM_ADMIN } });
}

/** Super-admin connecté, sinon retour à l'application (ou à la connexion sans session). */
export const requirePlatformAdmin = cache(async (): Promise<SessionUser> => {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (!isPlatformAdmin(user)) redirect("/tableau-de-bord");
  return user;
});

/** Une ligne du journal plateforme. */
export async function logPlatformAction(entry: {
  actor: Pick<User, "id" | "email">;
  action: string;
  targetType: "company" | "user";
  targetId?: string | null;
  companyId?: string | null;
  details?: Record<string, unknown>;
}): Promise<void> {
  await db.platformAuditLog.create({
    data: {
      actorId: entry.actor.id,
      actorEmail: entry.actor.email,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId ?? null,
      companyId: entry.companyId ?? null,
      details: (entry.details ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}
