import { expect, test } from "@playwright/test";
import {
  newOwner,
  signWebhook,
  signup,
  sql,
  testAddress,
  uniq,
  waitForDelivery,
  waitForProviderEvent,
  webhookEvent,
} from "./helpers";

const WEBHOOK = "/api/webhooks/resend";

test.describe("Journal des e-mails et webhooks Resend", () => {
  test("signature absente, invalide ou corps altéré : refusé sans mutation", async ({ request }) => {
    const body = webhookEvent("email.delivered", "inexistant");
    const missing = await request.post(WEBHOOK, { data: body, headers: { "content-type": "application/json" } });
    expect([400, 401]).toContain(missing.status());

    const wrongSecret = signWebhook(body, `whsec_${Buffer.from("mauvais-secret-0123456789").toString("base64")}`);
    expect([400, 401]).toContain((await request.post(WEBHOOK, { data: body, headers: wrongSecret })).status());

    const signed = signWebhook(body);
    const tampered = body.replace("email.delivered", "email.bounced");
    expect([400, 401]).toContain((await request.post(WEBHOOK, { data: tampered, headers: signed })).status());

    const rows = await sql(`select 1 from "EmailWebhookEvent" where "providerEventId" = $1`, [signed["svix-id"]]);
    expect(rows).toHaveLength(0);
  });

  test("événement livré : statut mis à jour une seule fois, événement répété ignoré, ordre respecté", async ({ page, request }) => {
    const owner = await signup(page);
    const delivery = await waitForDelivery(owner.email, "welcome");

    const deliveredAt = new Date();
    const body = webhookEvent("email.delivered", delivery.resendId!, deliveredAt);
    const headers = signWebhook(body);
    expect((await request.post(WEBHOOK, { data: body, headers })).status()).toBe(200);
    expect((await request.post(WEBHOOK, { data: body, headers })).status()).toBe(200);

    const events = await sql(`select 1 from "EmailWebhookEvent" where "providerEventId" = $1`, [headers["svix-id"]]);
    expect(events, "événement dédupliqué").toHaveLength(1);

    // Un « sent » plus ancien arrivé en retard ne fait pas reculer le statut.
    const late = webhookEvent("email.sent", delivery.resendId!, new Date(deliveredAt.getTime() - 60_000));
    expect((await request.post(WEBHOOK, { data: late, headers: signWebhook(late) })).status()).toBe(200);

    const [row] = await sql<{ status: string }>(`select status from "EmailDelivery" where id = $1`, [delivery.id]);
    expect(row.status).toBe("delivered");
  });

  test("événement rejeté : statut bounced", async ({ page, request }) => {
    const owner = await signup(page);
    const delivery = await waitForDelivery(owner.email, "welcome");
    const body = webhookEvent("email.bounced", delivery.resendId!);
    expect((await request.post(WEBHOOK, { data: body, headers: signWebhook(body) })).status()).toBe(200);
    const [row] = await sql<{ status: string }>(`select status from "EmailDelivery" where id = $1`, [delivery.id]);
    expect(row.status).toBe("bounced");
  });

  test("le journal ne garde ni clé ni secret, et chaque envoi a une clé d'idempotence unique", async ({ page }) => {
    const owner = await signup(page);
    await waitForDelivery(owner.email, "welcome");
    const rows = await sql<{ row: string }>(`select t::text as row from "EmailDelivery" t where "to" = $1`, [owner.email]);
    for (const { row } of rows) {
      expect(row).not.toMatch(/re_[A-Za-z0-9]{8,}|whsec_/);
    }
    const [dupes] = await sql<{ n: string }>(
      `select count(*)::text as n from (select "idempotencyKey" from "EmailDelivery" group by 1 having count(*) > 1) d`,
    );
    expect(dupes.n).toBe("0");
  });

  test("boîte réelle autorisée (RESEND_TEST_TO) : e-mail livré par Resend", async ({ page }) => {
    const inbox = process.env.RESEND_TEST_TO;
    test.skip(!inbox, "RESEND_TEST_TO non défini : réception en vraie boîte non vérifiée");
    const [local, domain] = inbox!.split("@");
    const owner = { ...newOwner(), email: `${local}+erp${uniq()}@${domain}` };
    await signup(page, owner);
    const delivery = await waitForDelivery(owner.email, "welcome");
    await waitForProviderEvent(delivery.resendId!);
  });
});

test("adresse de test valide", () => {
  expect(testAddress("x")).toBe("delivered+x@resend.dev");
});
