import { expect, test } from "@playwright/test";
import {
  fieldText,
  fillOwnerStep,
  L,
  logout,
  newOwner,
  signup,
  signupUntilStep3,
  waitForEmail,
} from "./helpers";

test.describe("Inscription en 3 étapes (5.2)", () => {
  test("valeurs par défaut de l'étape 1 : XOF, Côte d'Ivoire, Africa/Abidjan", async ({ page }) => {
    await page.goto("/inscription");
    expect(await fieldText(page.getByLabel(L("Devise")))).toContain("XOF");
    expect(await fieldText(page.getByLabel(L("Pays")))).toMatch(/côte d.ivoire/i);
    expect(await fieldText(page.getByLabel(L("Fuseau horaire")))).toContain("Africa/Abidjan");
  });

  test("crée le compte, ouvre le tableau de bord et envoie l'e-mail de bienvenue", async ({ page }) => {
    const owner = await signup(page);
    await expect(page.getByText(new RegExp(`Bienvenue,?\\s+${owner.firstName}`, "i")).first()).toBeVisible();

    const mail = await waitForEmail(owner.email, /bienvenue/i);
    expect(`${mail.text} ${mail.html}`).toContain(owner.firstName);
  });

  test("refuse un mot de passe faible (RG3)", async ({ page }) => {
    const owner = { ...newOwner(), password: "abc12345" };
    await signupUntilStep3(page, owner);
    await fillOwnerStep(page, owner);
    await page.getByRole("button", { name: L("S'inscrire") }).click();
    await expect(page.getByText(/au moins 8 caractères/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/inscription/);
  });

  test("refuse une confirmation différente", async ({ page }) => {
    const owner = newOwner();
    await signupUntilStep3(page, owner);
    await fillOwnerStep(page, owner, `${owner.password}x`);
    await page.getByRole("button", { name: L("S'inscrire") }).click();
    await expect(page.getByText(/doivent être identiques/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/inscription/);
  });

  test("refuse un nom d'utilisateur déjà pris", async ({ page }) => {
    const first = await signup(page);
    await logout(page);

    const second = { ...newOwner(), username: first.username };
    await signupUntilStep3(page, second);
    await fillOwnerStep(page, second);
    await page.getByRole("button", { name: L("S'inscrire") }).click();
    await expect(page.getByText(/déjà utilisé/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/inscription/);
  });
});
