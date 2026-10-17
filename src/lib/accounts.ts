import "server-only";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/auth/tokens";

/** RG1 : nom d'utilisateur et e-mail uniques dans toute l'application. */
export async function uniquenessErrors(username: string, email: string, exceptUserId?: string): Promise<Record<string, string> | null> {
  const clashes = await db.user.findMany({ where: { OR: [{ username }, { email }], NOT: exceptUserId ? { id: exceptUserId } : undefined }, select: { username: true, email: true } });
  const errors: Record<string, string> = {};
  if (clashes.some((u) => u.username === username)) errors.username = "Ce nom d'utilisateur est déjà utilisé";
  if (clashes.some((u) => u.email === email)) errors.email = "Cet e-mail est déjà utilisé";
  return Object.keys(errors).length ? errors : null;
}

/** Vrai si le jeton est utilisable (pour afficher le formulaire ou le message d'erreur). */
export async function isResetTokenUsable(token: string): Promise<boolean> {
  if (!token) return false;
  const row = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  return !!row && !row.usedAt && row.expiresAt > new Date();
}
