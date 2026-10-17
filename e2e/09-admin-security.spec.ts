import { expect, test } from "@playwright/test";
import {
  findLink,
  L,
  login,
  logout,
  newStaff,
  pickOption,
  resendCli,
  signup,
  sql,
  submitStaff,
  waitForDelivery,
  type ProviderEmail,
} from "./helpers";

test.describe("Utilisateurs : voir, modifier, lister, exporter (6.1 à 6.3)", () => {
  test("fiche en lecture seule puis modification journalisée", async ({ page }) => {
    await signup(page);
    const staff = newStaff();
    await submitStaff(page, staff);
    await expect(page.getByText(/utilisateur ajouté avec succès/i).first()).toBeVisible();

    const row = page.getByRole("row").filter({ hasText: staff.email });
    await row.getByRole("link", { name: /^voir$/i }).click();
    await expect(page.getByRole("heading", { name: /voir l.utilisateur/i })).toBeVisible();
    await expect(page.getByText(staff.email).first()).toBeVisible();
    await expect(page.getByText(/^actif$/i).first()).toBeVisible();
    await expect(page.getByRole("cell", { name: /^créé$/i })).toBeVisible();

    await page.getByRole("link", { name: /^modifier$/i }).click();
    await expect(page.getByRole("heading", { name: /modifier l.utilisateur/i })).toBeVisible();
    await expect(page.getByLabel(L("Prénom"))).toHaveValue(staff.firstName);
    await pickOption(page, L("Rôle"), "Gérant");
    await page.getByRole("button", { name: L("Sauvegarder") }).click();
    await expect(page.getByText(/utilisateur modifié avec succès/i).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /voir l.utilisateur/i })).toBeVisible();
    await expect(page.getByText(/rôle : caissier → gérant/i)).toBeVisible();

    // Mot de passe vide = inchangé : l'utilisateur se connecte toujours avec l'ancien.
    await logout(page);
    await login(page, staff.username, staff.password);
    await expect(page).toHaveURL(/\/tableau-de-bord/);
  });

  test("on ne peut pas désactiver son propre compte (RG4)", async ({ page }) => {
    const owner = await signup(page);
    await page.goto("/utilisateurs");
    await page.getByRole("row").filter({ hasText: owner.email }).getByRole("link", { name: /^modifier$/i }).click();
    await page.getByLabel(L("Est actif")).uncheck();
    await page.getByRole("button", { name: L("Sauvegarder") }).click();
    await expect(page.getByText(/désactiver votre propre compte/i).first()).toBeVisible();
  });

  test("tri, compteur et pagination", async ({ page }) => {
    const owner = await signup(page);
    const staff = newStaff();
    await submitStaff(page, staff);
    await expect(page.getByText(/utilisateur ajouté avec succès/i).first()).toBeVisible();

    await expect(page.getByText(/affiche 1 à 2 sur 2 entrées/i)).toBeVisible();
    const firstRow = page.getByRole("row").nth(1);
    await expect(firstRow).toContainText(owner.email);
    await page.getByRole("button", { name: /nom d.utilisateur/i }).click();
    await expect(firstRow).toContainText(staff.email);

    await page.getByLabel(L("Rechercher")).fill(staff.lastName);
    await expect(page.getByText(/filtré à partir de 2 entrées au total/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^précédent$/i })).toBeDisabled();
    await expect(page.getByRole("button", { name: /^prochain$/i })).toBeDisabled();
  });

  test("exports CSV, Excel et PDF : colonnes visibles et filtre, sans colonne Action (RG8)", async ({ page }) => {
    const owner = await signup(page);
    const csv = await page.request.get("/api/utilisateurs/export?format=csv&cols=username,email");
    expect(csv.status()).toBe(200);
    expect(csv.headers()["content-type"]).toContain("text/csv");
    const text = await csv.text();
    expect(text).toContain("Nom d'utilisateur;E-mail");
    expect(text).toContain(owner.email);
    expect(text).not.toMatch(/Action|Rôle/);

    const none = await (await page.request.get("/api/utilisateurs/export?format=csv&q=introuvable-xyz")).text();
    expect(none.trim().split(/\r?\n/)).toHaveLength(1);

    const xlsx = await page.request.get("/api/utilisateurs/export?format=xlsx");
    expect(xlsx.headers()["content-type"]).toContain("spreadsheetml");
    expect((await xlsx.body()).subarray(0, 2).toString()).toBe("PK");

    const pdf = await page.request.get("/api/utilisateurs/export?format=pdf");
    expect(pdf.headers()["content-type"]).toContain("application/pdf");
    expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
  });

  test("exports refusés sans session (401) et pour un caissier (403)", async ({ page }) => {
    await signup(page);
    const cashier = newStaff();
    await submitStaff(page, cashier);
    await expect(page.getByText(/utilisateur ajouté avec succès/i).first()).toBeVisible();
    await logout(page);
    expect((await page.request.get("/api/utilisateurs/export?format=csv")).status()).toBe(401);
    await login(page, cashier.username, cashier.password);
    await expect(page).toHaveURL(/\/tableau-de-bord/);
    expect((await page.request.get("/api/utilisateurs/export?format=csv")).status()).toBe(403);
  });
});

test.describe("Sécurité des comptes", () => {
  test("5 échecs de connexion bloquent le compte 15 minutes, même avec le bon mot de passe", async ({ page }) => {
    const owner = await signup(page);
    await logout(page);
    for (let i = 0; i < 5; i++) {
      await login(page, owner.username, `Mauvais!${i}x`);
      await expect(page.getByText(/mot de passe incorrect/i).first()).toBeVisible();
    }
    await login(page, owner.username, owner.password);
    await expect(page.getByText(/trop de tentatives/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/connexion/);
  });

  test("confirmation d'adresse : lien du bienvenue, usage unique, bandeau retiré", async ({ page }) => {
    const owner = await signup(page);
    await expect(page.getByText(/confirmez votre adresse e-mail/i).first()).toBeVisible();

    const welcome = await waitForDelivery(owner.email, "welcome");
    const link = findLink(resendCli<ProviderEmail>(["emails", "get", welcome.resendId!]), /verifier-email/);
    await page.goto(link);
    await expect(page.getByRole("heading", { name: /adresse e-mail confirmée/i })).toBeVisible();
    const [row] = await sql<{ verified: boolean }>(`select "emailVerifiedAt" is not null as verified from "User" where email = $1`, [owner.email]);
    expect(row.verified).toBe(true);

    await page.goto(link);
    await expect(page.getByRole("heading", { name: /lien invalide ou expiré/i })).toBeVisible();

    await page.goto("/tableau-de-bord");
    await expect(page.getByText(/confirmez votre adresse e-mail/i)).toHaveCount(0);
  });

  test("« Renvoyer le lien » envoie un e-mail de confirmation", async ({ page }) => {
    const owner = await signup(page);
    await page.getByRole("button", { name: /renvoyer le lien/i }).click();
    await expect(page.getByText(/lien envoyé/i).first()).toBeVisible();
    const delivery = await waitForDelivery(owner.email, "email_verification");
    expect(delivery.subject).toMatch(/confirmez/i);
  });
});
