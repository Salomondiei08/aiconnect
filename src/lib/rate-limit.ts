import "server-only";
import { db } from "@/lib/db";

/**
 * Limiteur à fenêtre glissante stocké en base : fonctionne avec plusieurs instances
 * et survit aux redémarrages. Chaque échec ajoute une ligne ; on compte celles de la fenêtre.
 */
export async function isLimited(key: string, max: number, windowMs: number): Promise<boolean> {
  const since = new Date(Date.now() - windowMs);
  return (await db.rateLimitHit.count({ where: { key, createdAt: { gte: since } } })) >= max;
}

export async function recordHit(key: string): Promise<void> {
  await db.rateLimitHit.create({ data: { key } });
}

export async function clearHits(key: string): Promise<void> {
  await db.rateLimitHit.deleteMany({ where: { key } });
}

/** Règles en vigueur : 5 échecs de connexion par compte en 15 min, 3 liens de réinitialisation par adresse et par heure. */
export const LIMITS = {
  login: { max: 5, windowMs: 15 * 60_000, message: "Trop de tentatives de connexion. Réessayez dans 15 minutes." },
  reset: { max: 3, windowMs: 60 * 60_000 },
  verify: { max: 3, windowMs: 60 * 60_000 },
} as const;
