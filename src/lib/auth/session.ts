import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { User } from "@/generated/prisma/client";
import { generateToken, hashToken } from "./tokens";

/** En HTTPS, préfixe __Host- : le cookie ne peut être posé que par cet hôte, en HTTPS, pour tout le site. */
const SECURE = (process.env.APP_URL ?? "").startsWith("https://");
const SESSION_COOKIE = SECURE ? "__Host-erp_session" : "erp_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Crée une session et pose le cookie httpOnly. À appeler depuis une action serveur. */
export async function createSession(userId: string): Promise<void> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({ data: { id: hashToken(token), userId, expiresAt } });
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, secure: SECURE, sameSite: "lax", path: "/", expires: expiresAt });
}

/** Utilisateur connecté (actif, autorisé à se connecter), ou null. Mis en cache pour la requête. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { id: hashToken(token) }, include: { user: true } });
  if (!session || session.expiresAt < new Date()) return null;
  if (!session.user.isActive || !session.user.canLogin) return null;
  return session.user;
});

/** Utilisateur connecté, sinon redirection vers la connexion. companyId vient toujours de la session. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  return user;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}

/** Déconnecte toutes les sessions d'un utilisateur (après changement de mot de passe). */
export async function destroyAllSessions(userId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId } });
}
