import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { Resend } from "resend";
import { isNewer, statusForEvent } from "./status";

describe("statuts webhook", () => {
  it("associe chaque événement Resend à un statut", () => {
    expect(statusForEvent("email.delivered")).toBe("delivered");
    expect(statusForEvent("email.bounced")).toBe("bounced");
    expect(statusForEvent("email.opened")).toBeNull();
  });

  it("ignore un événement plus ancien que le dernier appliqué", () => {
    const t = new Date("2026-10-18T10:00:00Z");
    expect(isNewer(new Date("2026-10-18T09:59:00Z"), t)).toBe(false);
    expect(isNewer(new Date("2026-10-18T10:01:00Z"), t)).toBe(true);
    expect(isNewer(t, null)).toBe(true);
  });
});

describe("signature webhook (vérification du SDK Resend)", () => {
  const secret = `whsec_${Buffer.from("secret-de-test-0123456789").toString("base64")}`;
  const sign = (body: string, id: string, ts: string, key = secret) =>
    `v1,${createHmac("sha256", Buffer.from(key.slice(6), "base64")).update(`${id}.${ts}.${body}`).digest("base64")}`;
  const verify = (payload: string, signature: string, ts: string) =>
    new Resend("re_unused").webhooks.verify({ payload, headers: { id: "msg_1", timestamp: ts, signature }, webhookSecret: secret });

  it("accepte une signature valide", () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const body = JSON.stringify({ type: "email.delivered", created_at: new Date().toISOString(), data: { email_id: "e1" } });
    expect(verify(body, sign(body, "msg_1", ts), ts)).toMatchObject({ type: "email.delivered" });
  });

  it("refuse un corps altéré, un mauvais secret et un horodatage périmé", () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const body = '{"type":"email.delivered"}';
    expect(() => verify('{"type":"email.bounced"}', sign(body, "msg_1", ts), ts)).toThrow();
    const other = `whsec_${Buffer.from("autre-secret-0123456789").toString("base64")}`;
    expect(() => verify(body, sign(body, "msg_1", ts, other), ts)).toThrow();
    const old = String(Math.floor(Date.now() / 1000) - 3600);
    expect(() => verify(body, sign(body, "msg_1", old), old)).toThrow();
  });
});
