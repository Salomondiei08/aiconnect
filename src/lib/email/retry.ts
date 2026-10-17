/**
 * Politique de reprise des envois, indépendante du SDK pour être testée sans réseau.
 * Les reprises réutilisent la même clé d'idempotence : Resend ne crée pas de second e-mail.
 */

export type ProviderError = { name: string; message: string; statusCode: number | null };

export type ProviderResult = { data: { id: string } | null; error: ProviderError | null };

/** Codes que Resend renvoie pour une panne passagère ; tout le reste est définitif (clé, adresse, quota...). */
const TRANSIENT_NAMES = new Set(["rate_limit_exceeded", "application_error", "internal_server_error", "concurrent_idempotent_requests"]);

export function isTransient(error: ProviderError): boolean {
  return TRANSIENT_NAMES.has(error.name) || error.statusCode === 429 || (error.statusCode ?? 0) >= 500;
}

export class EmailSendError extends Error {
  constructor(
    message: string,
    readonly attempts: number,
    readonly transient: boolean,
  ) {
    super(message);
  }
}

type RetryOptions = { maxAttempts?: number; baseDelayMs?: number; sleep?: (ms: number) => Promise<void> };

/** Envoie avec au plus `maxAttempts` essais et un délai progressif ; renvoie l'ID fournisseur et le nombre d'essais. */
export async function sendWithRetry(
  send: () => Promise<ProviderResult>,
  { maxAttempts = 3, baseDelayMs = 500, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) }: RetryOptions = {},
): Promise<{ id: string; attempts: number }> {
  for (let attempt = 1; ; attempt++) {
    let error: ProviderError;
    try {
      const result = await send();
      if (result.data?.id) return { id: result.data.id, attempts: attempt };
      error = result.error ?? { name: "missing_id", message: "Réponse Resend sans identifiant de message", statusCode: null };
      if (!result.error) throw new EmailSendError(error.message, attempt, false);
    } catch (thrown) {
      if (thrown instanceof EmailSendError) throw thrown;
      // Coupure réseau ou délai dépassé : passager par nature.
      error = { name: "network_error", message: "Fournisseur injoignable", statusCode: null };
    }
    const transient = isTransient(error) || error.name === "network_error";
    if (!transient || attempt >= maxAttempts) throw new EmailSendError(redact(error.message), attempt, transient);
    await sleep(baseDelayMs * 2 ** (attempt - 1));
  }
}

/** Retire toute clé ou secret qui se glisserait dans un message d'erreur. */
export function redact(message: string): string {
  return message.replace(/re_[A-Za-z0-9_]+/g, "re_***").replace(/whsec_[A-Za-z0-9+/=]+/g, "whsec_***").slice(0, 300);
}
