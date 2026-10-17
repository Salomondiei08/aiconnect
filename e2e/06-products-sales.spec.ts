import { expect, test } from "@playwright/test";
import {
  action,
  addProduct,
  digits,
  L,
  resendCli,
  signup,
  stockOf,
  testAddress,
  uniq,
  waitForDelivery,
  waitForProviderEvent,
} from "./helpers";

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

    // Reçu PDF réel, téléchargeable.
    const pdfHref = await page.getByRole("link", { name: /télécharger la facture/i }).getAttribute("href");
    expect(pdfHref).toBeTruthy();
    const pdf = await page.request.get(pdfHref!);
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()["content-type"]).toContain("application/pdf");
    expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");

    // Facture envoyée par e-mail avec la pièce jointe PDF.
    const customer = testAddress(`client-${uniq()}`);
    await page.getByLabel(L("E-mail du client")).fill(customer);
    await page.getByRole("button", { name: /envoyer la facture/i }).click();
    await expect(page.getByText(/facture envoyée/i).first()).toBeVisible();

    const delivery = await waitForDelivery(customer, "invoice");
    expect(delivery.attachments?.[0]?.filename).toMatch(/\.pdf$/i);
    expect(delivery.attachments?.[0]?.size ?? 0).toBeGreaterThan(500);
    await waitForProviderEvent(delivery.resendId!);
    const attachments = resendCli<{ data: { filename: string; content_type: string }[] }>([
      "emails",
      "attachments",
      delivery.resendId!,
    ]);
    expect(attachments.data.some((a) => /\.pdf$/i.test(a.filename))).toBe(true);

    expect(await stockOf(page, name)).toBe("8");

    await page.goto("/tableau-de-bord");
    await expect.poll(() => digits(page.getByTestId("kpi-total-ventes"))).toBe("3000");
    await expect(page.getByText(/aucune vente pour l.instant/i)).toHaveCount(0);
  });
});
