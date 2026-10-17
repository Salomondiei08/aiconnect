import { expect, test } from "@playwright/test";
import { action, horizontalOverflow } from "./helpers";

test.describe("Page d'accueil (5.1)", () => {
  test("affiche les appels à l'action et le texte de présentation", async ({ page }) => {
    await page.goto("/");
    await expect(action(page, /s.inscrire/i)).toBeVisible();
    await expect(action(page, /se connecter/i)).toBeVisible();
    await expect(page.getByText(/gérez tout votre commerce/i).first()).toBeVisible();
  });

  test("« Commencer gratuitement » mène à l'inscription", async ({ page }) => {
    await page.goto("/");
    await action(page, /commencer gratuitement/i).click();
    await expect(page).toHaveURL(/\/inscription/);
  });

  test("« Se connecter » mène à la connexion", async ({ page }) => {
    await page.goto("/");
    await action(page, /se connecter/i).click();
    await expect(page).toHaveURL(/\/connexion/);
  });

  test("le bouton de thème bascule clair/sombre", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const before = await html.getAttribute("class");
    await page.getByRole("button", { name: /thème/i }).first().click();
    await expect.poll(() => html.getAttribute("class")).not.toBe(before);
  });

  test("@mobile pas de défilement horizontal, appel à l'action visible", async ({ page }) => {
    await page.goto("/");
    await expect(action(page, /commencer gratuitement/i)).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
  });
});
