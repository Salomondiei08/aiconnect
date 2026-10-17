import { expect, test } from "@playwright/test";
import { addProduct, L, logout, signup, uniq } from "./helpers";

test.describe("Isolation entre entreprises (exigence 8)", () => {
  test("l'entreprise B ne voit ni les produits ni les utilisateurs de A", async ({ page }) => {
    const ownerA = await signup(page);
    const secret = `SecretA${uniq()}`;
    await addProduct(page, { name: secret, purchase: 100, sale: 200, qty: 5 });
    await logout(page);

    await signup(page);

    await page.goto("/produits");
    await expect(page.getByText(secret)).toHaveCount(0);

    await page.goto("/utilisateurs");
    await expect(page.getByText(ownerA.email)).toHaveCount(0);

    await page.goto("/ventes/nouvelle");
    await page.getByLabel(L("Rechercher un produit")).fill(secret);
    await expect(page.getByTestId("product-tile").filter({ hasText: secret })).toHaveCount(0);
  });

  test("sans session, les pages métier renvoient vers la connexion", async ({ page }) => {
    for (const path of ["/tableau-de-bord", "/utilisateurs", "/produits", "/ventes/nouvelle"]) {
      await page.goto(path);
      await expect(page, `${path} doit être protégé`).toHaveURL(/\/connexion/);
    }
  });
});
