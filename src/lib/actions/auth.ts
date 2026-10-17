"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { createElement } from "react";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroyAllSessions, destroySession } from "@/lib/auth/session";
import { generateToken, hashToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/send";
import {
  PasswordChangedEmail,
  passwordChangedText,
  PasswordResetEmail,
  passwordResetText,
  WelcomeEmail,
  welcomeText,
} from "@/lib/email/templates";
import { appUrl } from "@/lib/utils";
import { emailSchema, fieldErrors, passwordSchema, usernameSchema } from "@/lib/validation";
import { uniquenessErrors } from "@/lib/accounts";
import { INVALID_LINK, keepValues, type FormState } from "./form";

const RESET_TTL_MS = 60 * 60 * 1000;
const optional = z.string().trim().max(200).optional().transform((v) => v || null);

const signupSchema = z
  .object({
    company: z.string().trim().min(1, "Le nom de l'entreprise est requis").max(150),
    currency: z.string().trim().min(3).max(3),
    country: z.string().trim().min(1, "Le pays est requis"),
    commune: z.string().trim().min(1, "La commune est requise").max(100),
    city: z.string().trim().min(1, "La ville est requise").max(100),
    postalCode: z.string().trim().min(1, "Le code postal est requis (00000 si aucun)").max(20),
    landmark: z.string().trim().min(1, "Le point de repère est requis").max(200),
    timezone: z.string().trim().min(1),
    startDate: optional,
    website: optional,
    phone: optional,
    fiscalYearStartMonth: z.coerce.number().int().min(1).max(12),
    stockMethod: z.enum(["FIFO", "CMUP"]),
    tax1Name: optional,
    tax1Number: optional,
    firstName: z.string().trim().min(1, "Le prénom est requis").max(100),
    lastName: optional,
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Les mots de passe doivent être identiques" });

/** Inscription : entreprise, boutique par défaut et propriétaire Admin dans une transaction, puis session et e-mail de bienvenue. */
export async function signupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: keepValues(formData) };
  const d = parsed.data;

  const errors = await uniquenessErrors(d.username, d.email);
  if (errors) return { errors, values: keepValues(formData) };

  const passwordHash = await hashPassword(d.password);
  const user = await db.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: d.company,
        currency: d.currency,
        country: d.country,
        commune: d.commune,
        city: d.city,
        postalCode: d.postalCode,
        landmark: d.landmark,
        timezone: d.timezone,
        startDate: d.startDate ? new Date(d.startDate) : null,
        website: d.website,
        phone: d.phone,
        fiscalYearStartMonth: d.fiscalYearStartMonth,
        stockMethod: d.stockMethod,
        tax1Name: d.tax1Name,
        tax1Number: d.tax1Number,
      },
    });
    await tx.location.create({ data: { companyId: company.id, name: "Boutique principale", code: "BL0001" } });
    return tx.user.create({
      data: { companyId: company.id, username: d.username, email: d.email, firstName: d.firstName, lastName: d.lastName, passwordHash, role: "Admin" },
    });
  });

  await createSession(user.id);
  // L'e-mail part après la réponse : l'inscription ne dépend pas de la latence du fournisseur.
  after(() =>
    sendEmail({
      type: "welcome",
      to: user.email,
      subject: `Bienvenue sur Comptoir, ${user.firstName}`,
      react: createElement(WelcomeEmail, { firstName: user.firstName, company: d.company, url: appUrl("/tableau-de-bord") }),
      text: welcomeText({ firstName: user.firstName, company: d.company, url: appUrl("/tableau-de-bord") }),
      companyId: user.companyId,
    }),
  );
  redirect("/tableau-de-bord");
}

/** Connexion par nom d'utilisateur. Le statut désactivé n'est révélé qu'avec le bon mot de passe. */
export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = username ? await db.user.findUnique({ where: { username } }) : null;
  const valid = await verifyPassword(password, user?.passwordHash);
  if (!user || !valid) return { message: "Nom d'utilisateur ou mot de passe incorrect", values: { username } };
  if (!user.isActive || !user.canLogin) return { message: "Ce compte est désactivé", values: { username } };
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user.id);
  redirect("/tableau-de-bord");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/connexion");
}

const FORGOT_MESSAGE = "Si un compte existe avec cette adresse, un e-mail a été envoyé.";

/** Même réponse que l'adresse existe ou non : on ne révèle pas quels comptes existent. */
export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { errors: { email: "Adresse e-mail invalide" } };
  const user = await db.user.findUnique({ where: { email: parsed.data } });
  if (user && user.isActive && user.canLogin) {
    const token = generateToken();
    await db.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) } });
    const url = appUrl(`/reinitialiser?token=${token}`);
    after(() =>
      sendEmail({
        type: "password_reset",
        to: user.email,
        subject: "Réinitialisation de votre mot de passe",
        react: createElement(PasswordResetEmail, { firstName: user.firstName, url }),
        text: passwordResetText({ firstName: user.firstName, url }),
        companyId: user.companyId,
      }),
    );
  }
  return { success: FORGOT_MESSAGE };
}

const resetSchema = z
  .object({ token: z.string().min(20), password: passwordSchema, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Les mots de passe doivent être identiques" });

/** Consommation atomique : un seul appel peut marquer le jeton utilisé, même en double clic. */
export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const tokenHash = hashToken(parsed.data.token);
  const passwordHash = await hashPassword(parsed.data.password);

  const user = await db.$transaction(async (tx) => {
    const claimed = await tx.passwordResetToken.updateMany({ where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } });
    if (claimed.count !== 1) return null;
    const row = await tx.passwordResetToken.findUniqueOrThrow({ where: { tokenHash } });
    return tx.user.update({ where: { id: row.userId }, data: { passwordHash } });
  });
  if (!user) return { message: INVALID_LINK };

  await destroyAllSessions(user.id);
  after(() =>
    sendEmail({
      type: "password_changed",
      to: user.email,
      subject: "Votre mot de passe a été modifié",
      react: createElement(PasswordChangedEmail, { firstName: user.firstName }),
      text: passwordChangedText({ firstName: user.firstName }),
      companyId: user.companyId,
    }),
  );
  redirect("/connexion?motdepasse=modifie");
}
