"use server";

import { revalidatePath } from "next/cache";
import { destroyAllSessions, destroyCompanySessions } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { logPlatformAction, PLATFORM_ADMIN, requirePlatformAdmin } from "@/lib/platform";

export type PlatformActionResult = { ok: boolean; message: string };

/**
 * Actions de l'espace plateforme. Toutes exigent un super-admin connecté et journalisent l'opération :
 * ces écritures traversent l'isolation par entreprise, elles doivent rester traçables.
 */
async function guard() {
  return requirePlatformAdmin();
}

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/entreprises");
  revalidatePath("/admin/utilisateurs");
  revalidatePath("/admin/journal");
}

/** Suspend ou réactive une entreprise. La suspension ferme toutes les sessions de ses comptes. */
export async function setCompanyStatusAction(companyId: string, status: "active" | "suspended"): Promise<PlatformActionResult> {
  const actor = await guard();
  const company = await db.company.findUnique({ where: { id: companyId }, select: { id: true, name: true, status: true } });
  if (!company) return { ok: false, message: "Entreprise introuvable" };
  if (company.status === status) return { ok: false, message: status === "suspended" ? "Cette entreprise est déjà suspendue" : "Cette entreprise est déjà active" };

  await db.company.update({ where: { id: company.id }, data: { status } });
  const closedSessions = status === "suspended" ? await destroyCompanySessions(company.id) : 0;
  await logPlatformAction({
    actor,
    action: status === "suspended" ? "company_suspended" : "company_reactivated",
    targetType: "company",
    targetId: company.id,
    companyId: company.id,
    details: { name: company.name, sessionsClosed: closedSessions },
  });
  revalidateAdmin();
  revalidatePath("/admin/entreprises/[id]", "page");
  return {
    ok: true,
    message:
      status === "suspended"
        ? `« ${company.name} » est suspendue${closedSessions ? ` · ${closedSessions} session(s) fermée(s)` : ""}`
        : `« ${company.name} » est réactivée`,
  };
}

/** Active ou désactive un compte, quelle que soit son entreprise. La désactivation ferme ses sessions. */
export async function setUserActiveAction(userId: string, isActive: boolean): Promise<PlatformActionResult> {
  const actor = await guard();
  const target = await db.user.findUnique({ where: { id: userId }, select: { id: true, email: true, companyId: true, isActive: true } });
  if (!target) return { ok: false, message: "Compte introuvable" };
  if (target.isActive === isActive) return { ok: false, message: isActive ? "Ce compte est déjà actif" : "Ce compte est déjà désactivé" };

  await db.user.update({ where: { id: target.id }, data: { isActive } });
  if (!isActive) await destroyAllSessions(target.id);
  await logPlatformAction({
    actor,
    action: isActive ? "user_activated" : "user_deactivated",
    targetType: "user",
    targetId: target.id,
    companyId: target.companyId,
    details: { email: target.email },
  });
  revalidateAdmin();
  revalidatePath("/admin/entreprises/[id]", "page");
  return { ok: true, message: isActive ? `Compte ${target.email} réactivé` : `Compte ${target.email} désactivé` };
}

/**
 * Accorde ou retire le droit super-admin.
 * Se retirer soi-même est refusé : la plateforme garde toujours au moins un administrateur connecté.
 */
export async function setPlatformAdminAction(userId: string, grant: boolean): Promise<PlatformActionResult> {
  const actor = await guard();
  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, companyId: true, platformRole: true, isActive: true },
  });
  if (!target) return { ok: false, message: "Compte introuvable" };
  if (grant && !target.isActive) return { ok: false, message: "Réactivez ce compte avant de lui accorder ce droit" };
  if (!grant && target.id === actor.id) return { ok: false, message: "Vous ne pouvez pas retirer votre propre droit super-admin" };
  const already = target.platformRole === PLATFORM_ADMIN;
  if (already === grant) return { ok: false, message: grant ? "Ce compte est déjà super-admin" : "Ce compte n'est pas super-admin" };

  await db.user.update({ where: { id: target.id }, data: { platformRole: grant ? PLATFORM_ADMIN : null } });
  if (!grant) await destroyAllSessions(target.id);
  await logPlatformAction({
    actor,
    action: grant ? "platform_admin_granted" : "platform_admin_revoked",
    targetType: "user",
    targetId: target.id,
    companyId: target.companyId,
    details: { email: target.email },
  });
  revalidateAdmin();
  return { ok: true, message: grant ? `Droit super-admin accordé à ${target.email}` : `Droit super-admin retiré à ${target.email}` };
}

/** Ferme toutes les sessions d'un compte (mot de passe compromis, poste partagé). */
export async function revokeUserSessionsAction(userId: string): Promise<PlatformActionResult> {
  const actor = await guard();
  const target = await db.user.findUnique({ where: { id: userId }, select: { id: true, email: true, companyId: true } });
  if (!target) return { ok: false, message: "Compte introuvable" };
  await destroyAllSessions(target.id);
  await logPlatformAction({
    actor,
    action: "sessions_revoked",
    targetType: "user",
    targetId: target.id,
    companyId: target.companyId,
    details: { email: target.email },
  });
  revalidateAdmin();
  return { ok: true, message: `Sessions de ${target.email} fermées` };
}
