import { expect, test } from "@playwright/test";
import { action, addProduct, digits, L, signup, stockOf, uniq } from "./helpers";

test.describe("Produits et caisse (4.2, 4.3)", () => {
  test("vente au comptoir : stock décrémenté et tableau de bord à jour", async ({ page }) => {
    await signup(page);
    const name = `Riz${uniq()}`;

    await addProduct(page, { name, purchase: 1000, sale: 1500, qty: 10, min: 2 });
    expect(await stockOf(page, name)).toBe("10");

    await page.goto("/tableau-de-bord");
    await action(page, /nouvelle vente/i).click();
    await expect(page).toHaveURL(/\/ventes\/nouvelle/);

    await page.getByLabel(L("Rechercher un produit")).fill(name);
    const tile = page.getByTestId("product-tile").filter({ hasText: name });
    await tile.click();
    await tile.click();
    await expect.poll(() => digits(page.getByTestId("cart-total"))).toBe("3000");

    await page.getByRole("button", { name: /encaisser/i }).click();
    await page.getByRole("button", { name: /valider le paiement/i }).click();
    await expect(page.getByText(/vente enregistrée/i).first()).toBeVisible();

    expect(await stockOf(page, name)).toBe("8");

    await page.goto("/tableau-de-bord");
    await expect.poll(() => digits(page.getByTestId("kpi-total-ventes"))).toBe("3000");
    await expect(page.getByText(/aucune vente pour l.instant/i)).toHaveCount(0);
  });
});
