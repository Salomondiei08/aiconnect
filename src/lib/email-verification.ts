import "server-only";
import { db } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { appUrl } from "@/lib/utils";

const VERIFY_TTL_MS = 48 * 60 * 60 * 1000;

/** Vérification obligatoire avant la connexion seulement si REQUIRE_EMAIL_VERIFICATION=1. */
export const verificationRequired = () => process.env.REQUIRE_EMAIL_VERIFICATION === "1";

/** Crée un lien de confirmation (empreinte seule en base) et renvoie l'URL à mettre dans l'e-mail. */
export async function createVerificationUrl(userId: string): Promise<string> {
  const token = generateToken();
  await db.emailVerificationToken.create({ data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + VERIFY_TTL_MS) } });
  return appUrl(`/verifier-email?token=${token}`);
}

/** Consomme le jeton de façon atomique ; renvoie l'utilisateur confirmé ou null si lien invalide, expiré ou déjà utilisé. */
export async function consumeVerificationToken(token: string) {
  if (!token) return null;
  const tokenHash = hashToken(token);
  return db.$transaction(async (tx) => {
    const claimed = await tx.emailVerificationToken.updateMany({ where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
    if (claimed.count !== 1) return null;
    const row = await tx.emailVerificationToken.findUniqueOrThrow({ where: { tokenHash } });
    return tx.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: new Date() } });
  });
}
