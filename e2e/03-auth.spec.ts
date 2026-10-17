import { expect, test } from "@playwright/test";
import {
  EMAIL_LABEL,
  findLink,
  L,
  login,
  logout,
  PASSWORD,
  resendCli,
  signup,
  sql,
  testAddress,
  waitForDelivery,
  type ProviderEmail,
} from "./helpers";

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

  test("mot de passe oublié : vrai e-mail, jeton haché, usage unique, confirmation", async ({ page }) => {
    const owner = await signup(page);
    await logout(page);

    await page.goto("/connexion");
    await page.getByRole("link", { name: /mot de passe oublié/i }).click();
    await page.getByLabel(EMAIL_LABEL).fill(owner.email);
    await page.getByRole("button", { name: /envoyer le lien/i }).click();
    await expect(page.getByText(/un e-mail a été envoyé/i).first()).toBeVisible();

    const delivery = await waitForDelivery(owner.email, "password_reset");
    expect(delivery.subject).toMatch(/réinitialisation/i);
    const sent = resendCli<ProviderEmail>(["emails", "get", delivery.resendId!]);
    const link = findLink(sent, /reinitialiser/i);

    // Le jeton en clair ne doit exister nulle part en base (seule son empreinte est stockée).
    const url = new URL(link);
    const token = url.searchParams.get("token") ?? url.pathname.split("/").pop() ?? "";
    expect(token.length).toBeGreaterThanOrEqual(32);
    const [leak] = await sql<{ n: string }>(
      `select count(*)::text as n from "PasswordResetToken" t where t::text like '%' || $1 || '%'`,
      [token],
    );
    expect(leak.n, "jeton stocké en clair").toBe("0");

    await page.goto(link);
    const newPassword = "Nouveau!2026x";
    await page.getByLabel(L("Nouveau mot de passe")).fill(newPassword);
    await page.getByLabel(L("Confirmation du mot de passe")).fill(newPassword);
    await page.getByRole("button", { name: L("Enregistrer") }).click();
    await expect(page).toHaveURL(/\/connexion/);
    await expect(page.getByText(/mot de passe modifié/i).first()).toBeVisible();

    const changed = await waitForDelivery(owner.email, "password_changed");
    expect(changed.subject).toMatch(/mot de passe/i);

    // Usage unique : le même lien ne marche plus.
    await page.goto(link);
    await expect(page.getByText(/lien invalide ou expiré/i).first()).toBeVisible();

    await login(page, owner.username, newPassword);
    await expect(page).toHaveURL(/\/tableau-de-bord/);

    await logout(page);
    await login(page, owner.username, PASSWORD);
    await expect(page.getByText(/nom d.utilisateur ou mot de passe incorrect/i).first()).toBeVisible();
  });

  test("mot de passe oublié avec une adresse inconnue : même réponse, aucun envoi", async ({ page }) => {
    const unknown = testAddress(`inconnu-${Date.now()}`);
    await page.goto("/mot-de-passe-oublie");
    await page.getByLabel(EMAIL_LABEL).fill(unknown);
    await page.getByRole("button", { name: /envoyer le lien/i }).click();
    await expect(page.getByText(/un e-mail a été envoyé/i).first()).toBeVisible();
    const rows = await sql(`select 1 from "EmailDelivery" where "to" = $1`, [unknown]);
    expect(rows).toHaveLength(0);
  });
});
