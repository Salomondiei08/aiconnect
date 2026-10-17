import { expect, test } from "@playwright/test";
import { action, digits, horizontalOverflow, signup } from "./helpers";

const KPIS = [
  "kpi-total-ventes",
  "kpi-factures-impayees",
  "kpi-total-achats",
  "kpi-total-depenses",
  "kpi-net",
];

test.describe("Tableau de bord (4.19)", () => {
  test("nouvelle entreprise : cartes à 0 et invitation à vendre", async ({ page }) => {
    await signup(page);
    for (const id of KPIS) {
      const card = page.getByTestId(id);
      await expect(card).toBeVisible();
      expect(await digits(card), `${id} doit afficher 0`).toBe("0");
    }
    await expect(page.getByText(/aucune vente pour l.instant/i).first()).toBeVisible();
    await expect(action(page, /nouvelle vente/i)).toBeVisible();
  });

  test("le menu latéral mène aux modules", async ({ page }) => {
    await signup(page);
    await page.getByRole("link", { name: /^utilisateurs$/i }).first().click();
    await expect(page).toHaveURL(/\/utilisateurs/);
    await page.getByRole("link", { name: /^produits$/i }).first().click();
    await expect(page).toHaveURL(/\/produits/);
  });

  test("@mobile inscription, menu hamburger et aucun débordement", async ({ page }) => {
    await signup(page);
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    await page.getByRole("button", { name: /menu/i }).first().click();
    await page.getByRole("link", { name: /^utilisateurs$/i }).first().click();
    await expect(page).toHaveURL(/\/utilisateurs/);
  });
});
