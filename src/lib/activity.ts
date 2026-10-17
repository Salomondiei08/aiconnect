import "server-only";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

export type ActivityAction = "created" | "updated" | "login" | "password_changed" | "deactivated" | "email_verified";

export const ACTIVITY_LABELS: Record<string, string> = {
  created: "Créé",
  updated: "Modifié",
  login: "Connexion",
  password_changed: "Mot de passe changé",
  deactivated: "Désactivé",
  email_verified: "Adresse e-mail confirmée",
};

/** Ajoute une entrée au journal ; un échec de journalisation ne bloque jamais l'action principale. */
export async function logActivity(entry: {
  companyId: string;
  targetId: string;
  actorId?: string | null;
  action: ActivityAction;
  details?: Record<string, [unknown, unknown]>;
}): Promise<void> {
  try {
    await db.activityLog.create({
      data: { ...entry, actorId: entry.actorId ?? null, details: entry.details ? (entry.details as Prisma.InputJsonValue) : undefined },
    });
  } catch (error) {
    console.error("[activité] journalisation impossible", error);
  }
}
