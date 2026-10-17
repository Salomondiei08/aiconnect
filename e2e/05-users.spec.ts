import { expect, test } from "@playwright/test";
import { L, login, logout, newStaff, signup, submitStaff, type Owner } from "./helpers";

test.describe("Utilisateurs (6.1, 6.2)", () => {
  let owner: Owner;

  test.beforeEach(async ({ page }) => {
    owner = await signup(page);
  });

  test("ajoute un caissier qui peut ensuite se connecter", async ({ page }) => {
    const user = newStaff();
    await submitStaff(page, user);
    await expect(page.getByText(/utilisateur ajouté avec succès/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/utilisateurs\/?$/);

    const row = page.getByRole("row").filter({ hasText: user.email });
    await expect(row).toBeVisible();
    await expect(row).toContainText(/caissier/i);

    await logout(page);
    await login(page, user.username, user.password);
    await expect(page).toHaveURL(/\/tableau-de-bord/);
  });

  test("refuse un e-mail déjà utilisé (RG1)", async ({ page }) => {
    await submitStaff(page, newStaff({ email: owner.email }));
    await expect(page.getByText(/déjà utilisé/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/utilisateurs\/nouveau/);
  });

  test("refuse un mot de passe faible (RG3)", async ({ page }) => {
    await submitStaff(page, newStaff({ password: "abc12345" }));
    await expect(page.getByText(/au moins 8 caractères/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/utilisateurs\/nouveau/);
  });

  test("un compte désactivé ne peut pas se connecter (5.4)", async ({ page }) => {
    const user = newStaff({ active: false });
    await submitStaff(page, user);
    await expect(page.getByText(/utilisateur ajouté avec succès/i).first()).toBeVisible();

    await logout(page);
    await login(page, user.username, user.password);
    await expect(page.getByText(/ce compte est désactivé/i).first()).toBeVisible();
    await page.goto("/tableau-de-bord");
    await expect(page).toHaveURL(/\/connexion/);
  });

  test("la recherche filtre sans tenir compte de la casse (RG7)", async ({ page }) => {
    const user = newStaff();
    await submitStaff(page, user);
    await expect(page.getByText(/utilisateur ajouté avec succès/i).first()).toBeVisible();

    const search = page.getByLabel(L("Rechercher")).or(page.getByPlaceholder(/rechercher/i)).first();
    await search.fill(user.lastName.toUpperCase());
    await expect(page.getByRole("row").filter({ hasText: user.email })).toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: owner.email })).toHaveCount(0);
  });

  test("impossible de supprimer son propre compte (RG4)", async ({ page }) => {
    await page.goto("/utilisateurs");
    const ownRow = page.getByRole("row").filter({ hasText: owner.email });
    await expect(ownRow.getByRole("button", { name: /effacer/i })).toBeDisabled();
  });
});
