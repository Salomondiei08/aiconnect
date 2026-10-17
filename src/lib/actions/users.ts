"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { requireUser } from "@/lib/auth/session";
import { uniquenessErrors } from "@/lib/accounts";
import { can } from "@/lib/roles";
import { baseUsername, emailSchema, fieldErrors, passwordSchema, ROLES, usernameSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { keepValues, type FormState } from "./form";

const checkbox = z.literal("on").optional().transform((v) => v === "on");
const optional = z.string().trim().max(100).optional().transform((v) => v || null);

const makeUserSchema = (editing: boolean) => z
  .object({
    prefix: z.enum(["", "M", "Mme", "Mlle"]).optional().transform((v) => v || null),
    firstName: z.string().trim().min(1, "Le prénom est requis").max(100),
    lastName: optional,
    email: emailSchema,
    isActive: checkbox,
    canLogin: checkbox,
    username: z.string().trim().optional(),
    password: z.string().optional(),
    confirm: z.string().optional(),
    role: z.enum(ROLES, { message: "Choisissez un rôle" }),
    allLocations: checkbox,
    locationIds: z.array(z.string()).default([]),
  })
  .superRefine((d, ctx) => {
    if (d.username) {
      const r = usernameSchema.safeParse(d.username);
      if (!r.success) ctx.addIssue({ code: "custom", path: ["username"], message: r.error.issues[0].message });
    }
    // En modification, un mot de passe vide garde l'actuel.
    if (d.canLogin && !(editing && !d.password && !d.confirm)) {
      const r = passwordSchema.safeParse(d.password ?? "");
      if (!r.success) ctx.addIssue({ code: "custom", path: ["password"], message: r.error.issues[0].message });
      else if (d.password !== d.confirm) ctx.addIssue({ code: "custom", path: ["confirm"], message: "Les mots de passe doivent être identiques" });
    }
    if (!d.allLocations && d.locationIds.length === 0) ctx.addIssue({ code: "custom", path: ["locationIds"], message: "Choisissez au moins un emplacement" });
  });

/** Ajoute un membre de l'équipe dans l'entreprise de l'administrateur connecté. */
export async function createUserAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireUser();
  if (!can.manageUsers(admin)) return { message: "Vous n'avez pas le droit de gérer les utilisateurs" };

  const parsed = makeUserSchema(false).safeParse({ ...Object.fromEntries(formData), locationIds: formData.getAll("locationIds") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: keepValues(formData) };
  const d = parsed.data;

  // Les emplacements cochés doivent appartenir à cette entreprise (jamais confiance au navigateur).
  const locations = d.allLocations ? [] : await db.location.findMany({ where: { companyId: admin.companyId, id: { in: d.locationIds } }, select: { id: true } });
  if (!d.allLocations && locations.length !== d.locationIds.length) return { errors: { locationIds: "Emplacement inconnu" }, values: keepValues(formData) };

  const username = d.username ? d.username.toLowerCase() : await generateUsername(d.firstName);
  const errors = await uniquenessErrors(username, d.email);
  if (errors) return { errors, values: keepValues(formData) };

  const created = await db.user.create({
    data: {
      company: { connect: { id: admin.companyId } },
      prefix: d.prefix,
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      username,
      role: d.role,
      isActive: d.isActive,
      canLogin: d.canLogin,
      passwordHash: d.canLogin ? await hashPassword(d.password!) : null,
      allLocations: d.allLocations,
      locations: { create: locations.map((l) => ({ locationId: l.id })) },
    },
  });
  await logActivity({ companyId: admin.companyId, targetId: created.id, actorId: admin.id, action: "created" });
  revalidatePath("/utilisateurs");
  return { success: "Utilisateur ajouté avec succès" };
}

const TRACKED: Record<string, string> = {
  prefix: "Préfixe",
  firstName: "Prénom",
  lastName: "Nom de famille",
  email: "E-mail",
  username: "Nom d'utilisateur",
  role: "Rôle",
  isActive: "Est actif",
  canLogin: "Autoriser la connexion",
  allLocations: "Tous les emplacements",
};

/**
 * Modifie un utilisateur de la même entreprise.
 * RG4 : on ne peut ni se désactiver ni se retirer la connexion. RG5 : le dernier administrateur actif reste administrateur.
 */
export async function updateUserAction(userId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireUser();
  if (!can.manageUsers(admin)) return { message: "Vous n'avez pas le droit de gérer les utilisateurs" };
  const target = await db.user.findFirst({ where: { id: userId, companyId: admin.companyId } });
  if (!target) return { message: "Utilisateur introuvable" };

  const parsed = makeUserSchema(true).safeParse({ ...Object.fromEntries(formData), locationIds: formData.getAll("locationIds") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: keepValues(formData) };
  const d = parsed.data;

  if (target.id === admin.id && (!d.isActive || !d.canLogin)) return { message: "Vous ne pouvez pas désactiver votre propre compte", values: keepValues(formData) };
  if (target.role === "Admin" && d.role !== "Admin") {
    const admins = await db.user.count({ where: { companyId: admin.companyId, role: "Admin", isActive: true } });
    if (admins <= 1) return { errors: { role: "Impossible de rétrograder le dernier administrateur" }, values: keepValues(formData) };
  }
  if (d.canLogin && !target.passwordHash && !d.password) return { errors: { password: "Un mot de passe est requis pour autoriser la connexion" }, values: keepValues(formData) };

  const locations = d.allLocations ? [] : await db.location.findMany({ where: { companyId: admin.companyId, id: { in: d.locationIds } }, select: { id: true } });
  if (!d.allLocations && locations.length !== d.locationIds.length) return { errors: { locationIds: "Emplacement inconnu" }, values: keepValues(formData) };

  const username = d.username ? d.username.toLowerCase() : target.username;
  const errors = await uniquenessErrors(username, d.email, target.id);
  if (errors) return { errors, values: keepValues(formData) };

  const next = { prefix: d.prefix, firstName: d.firstName, lastName: d.lastName, email: d.email, username, role: d.role, isActive: d.isActive, canLogin: d.canLogin, allLocations: d.allLocations };
  const details: Record<string, [unknown, unknown]> = {};
  for (const [field, label] of Object.entries(TRACKED)) {
    const before = target[field as keyof typeof next];
    const after = next[field as keyof typeof next];
    if (before !== after) details[label] = [before, after];
  }
  const passwordChanged = d.canLogin && !!d.password;

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: target.id },
      data: {
        ...next,
        // Nouvelle adresse : elle doit être confirmée à nouveau.
        emailVerifiedAt: d.email === target.email ? target.emailVerifiedAt : null,
        passwordHash: passwordChanged ? await hashPassword(d.password!) : d.canLogin ? target.passwordHash : null,
      },
    });
    await tx.userLocation.deleteMany({ where: { userId: target.id } });
    if (locations.length) await tx.userLocation.createMany({ data: locations.map((l) => ({ userId: target.id, locationId: l.id })) });
    // Accès retiré ou mot de passe changé : les sessions ouvertes de cette personne sont fermées.
    if (!d.isActive || !d.canLogin || passwordChanged) await tx.session.deleteMany({ where: { userId: target.id } });
  });
  if (Object.keys(details).length) await logActivity({ companyId: admin.companyId, targetId: target.id, actorId: admin.id, action: "updated", details });
  if (passwordChanged) await logActivity({ companyId: admin.companyId, targetId: target.id, actorId: admin.id, action: "password_changed" });
  revalidatePath("/utilisateurs");
  revalidatePath(`/utilisateurs/${target.id}`);
  return { success: "Utilisateur modifié avec succès" };
}

/** RG2 : prénom + chiffre si l'identifiant est déjà pris. */
async function generateUsername(firstName: string): Promise<string> {
  const base = baseUsername(firstName);
  const taken = new Set((await db.user.findMany({ where: { username: { startsWith: base } }, select: { username: true } })).map((u) => u.username));
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) if (!taken.has(`${base}${i}`)) return `${base}${i}`;
}

/**
 * RG6 : effacement logique (compte désactivé, historique conservé).
 * RG4 : pas soi-même. RG5 : jamais le dernier administrateur actif.
 */
export async function deactivateUserAction(userId: string): Promise<{ error?: string }> {
  const admin = await requireUser();
  if (!can.manageUsers(admin)) return { error: "Action non autorisée" };
  if (userId === admin.id) return { error: "Vous ne pouvez pas supprimer votre propre compte" };
  const target = await db.user.findFirst({ where: { id: userId, companyId: admin.companyId } });
  if (!target) return { error: "Utilisateur introuvable" };
  if (target.role === "Admin") {
    const admins = await db.user.count({ where: { companyId: admin.companyId, role: "Admin", isActive: true } });
    if (admins <= 1) return { error: "Impossible de supprimer le dernier administrateur" };
  }
  await db.$transaction([
    db.user.update({ where: { id: target.id }, data: { isActive: false } }),
    db.session.deleteMany({ where: { userId: target.id } }),
  ]);
  await logActivity({ companyId: admin.companyId, targetId: target.id, actorId: admin.id, action: "deactivated" });
  revalidatePath("/utilisateurs");
  return {};
}
