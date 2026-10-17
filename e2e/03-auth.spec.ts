import { expect, test } from "@playwright/test";
import { EMAIL_LABEL, findLink, L, login, logout, PASSWORD, signup, waitForEmail } from "./helpers";

test.describe("Connexion et mot de passe oublié (5.4)", () => {
  test("une page protégée renvoie vers la connexion, puis la connexion ouvre le tableau de bord", async ({ page }) => {
    const owner = await signup(page);
    await logout(page);

    await page.goto("/tableau-de-bord");
    await expect(page).toHaveURL(/\/connexion/);

    await login(page, owner.username, owner.password);
    await expect(page).toHaveURL(/\/tableau-de-bord/);
  });

  test("mauvais mot de passe : message clair, pas de session", async ({ page }) => {
    const owner = await signup(page);
    await logout(page);

    await login(page, owner.username, "Mauvais!2026");
    await expect(page.getByText(/nom d.utilisateur ou mot de passe incorrect/i).first()).toBeVisible();
    await page.goto("/tableau-de-bord");
    await expect(page).toHaveURL(/\/connexion/);
  });

  test("mot de passe oublié : e-mail reçu, lien valide, nouveau mot de passe actif", async ({ page }) => {
    const owner = await signup(page);
    await logout(page);

    await page.goto("/connexion");
    await page.getByRole("link", { name: /mot de passe oublié/i }).click();
    await page.getByLabel(EMAIL_LABEL).fill(owner.email);
    await page.getByRole("button", { name: /envoyer le lien/i }).click();
    await expect(page.getByText(/un e-mail a été envoyé/i).first()).toBeVisible();

    const mail = await waitForEmail(owner.email, /réinitialisation/i);
    await page.goto(findLink(mail, /reinitialiser|reset-password|token/i));

    const newPassword = "Nouveau!2026x";
    await page.getByLabel(L("Nouveau mot de passe")).fill(newPassword);
    await page.getByLabel(L("Confirmation du mot de passe")).fill(newPassword);
    await page.getByRole("button", { name: L("Enregistrer") }).click();
    await expect(page).toHaveURL(/\/connexion/);

    await login(page, owner.username, newPassword);
    await expect(page).toHaveURL(/\/tableau-de-bord/);

    await logout(page);
    await login(page, owner.username, PASSWORD);
    await expect(page.getByText(/nom d.utilisateur ou mot de passe incorrect/i).first()).toBeVisible();
  });

  test("mot de passe oublié avec une adresse inconnue : même réponse (pas de fuite)", async ({ page }) => {
    await page.goto("/mot-de-passe-oublie");
    await page.getByLabel(EMAIL_LABEL).fill("personne-inconnue@example.test");
    await page.getByRole("button", { name: /envoyer le lien/i }).click();
    await expect(page.getByText(/un e-mail a été envoyé/i).first()).toBeVisible();
  });
});
