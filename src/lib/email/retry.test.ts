import { describe, expect, it, vi } from "vitest";
import { EmailSendError, isTransient, redact, sendWithRetry, type ProviderResult } from "./retry";

const noSleep = { sleep: async () => {} };
const ok = (id: string): ProviderResult => ({ data: { id }, error: null });
const fail = (name: string, statusCode: number | null, message = name): ProviderResult => ({ data: null, error: { name, statusCode, message } });

describe("sendWithRetry (Resend simulé)", () => {
  it("renvoie l'ID Resend dès le premier succès", async () => {
    const send = vi.fn(async () => ok("msg_1"));
    await expect(sendWithRetry(send, noSleep)).resolves.toEqual({ id: "msg_1", attempts: 1 });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("réessaie une erreur passagère puis réussit, sans dépasser le plafond", async () => {
    const send = vi.fn<() => Promise<ProviderResult>>().mockResolvedValueOnce(fail("rate_limit_exceeded", 429)).mockResolvedValueOnce(ok("msg_2"));
    await expect(sendWithRetry(send, noSleep)).resolves.toEqual({ id: "msg_2", attempts: 2 });
  });

  it("abandonne après 3 erreurs passagères", async () => {
    const send = vi.fn(async () => fail("internal_server_error", 500));
    await expect(sendWithRetry(send, noSleep)).rejects.toMatchObject({ attempts: 3, transient: true });
    expect(send).toHaveBeenCalledTimes(3);
  });

  it("ne réessaie pas une clé API invalide (erreur définitive)", async () => {
    const send = vi.fn(async () => fail("invalid_api_key", 403, "API key is invalid"));
    await expect(sendWithRetry(send, noSleep)).rejects.toMatchObject({ attempts: 1, transient: false, message: "API key is invalid" });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("traite une coupure réseau comme passagère", async () => {
    const send = vi.fn<() => Promise<ProviderResult>>().mockRejectedValueOnce(new TypeError("fetch failed")).mockResolvedValueOnce(ok("msg_3"));
    await expect(sendWithRetry(send, noSleep)).resolves.toEqual({ id: "msg_3", attempts: 2 });
  });

  it("refuse une réponse sans identifiant : jamais de faux « envoyé »", async () => {
    const send = vi.fn(async (): Promise<ProviderResult> => ({ data: null, error: null }));
    await expect(sendWithRetry(send, noSleep)).rejects.toBeInstanceOf(EmailSendError);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("allonge le délai entre les essais", async () => {
    const sleep = vi.fn(async () => {});
    const send = vi.fn(async () => fail("application_error", 500));
    await sendWithRetry(send, { sleep, baseDelayMs: 100 }).catch(() => {});
    expect(sleep.mock.calls).toEqual([[100], [200]]);
  });
});

describe("isTransient et redact", () => {
  it("classe les erreurs", () => {
    expect(isTransient({ name: "validation_error", message: "", statusCode: 422 })).toBe(false);
    expect(isTransient({ name: "daily_quota_exceeded", message: "", statusCode: 429 })).toBe(true);
    expect(isTransient({ name: "application_error", message: "", statusCode: null })).toBe(true);
  });

  it("masque clés et secrets dans les messages", () => {
    expect(redact("bad key re_AbC123_xyz and whsec_QUJD=")).toBe("bad key re_*** and whsec_***");
  });
});
