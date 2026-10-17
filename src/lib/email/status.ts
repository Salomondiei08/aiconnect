/** Correspondance événement webhook Resend → statut interne du journal. */
const EVENT_STATUS: Record<string, string> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.delivery_delayed": "delayed",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.failed": "failed",
};

export function statusForEvent(type: string): string | null {
  return EVENT_STATUS[type] ?? null;
}

/** Un événement plus ancien que le dernier appliqué ne fait jamais reculer le statut (ordre d'arrivée non garanti). */
export function isNewer(occurredAt: Date, lastEventAt: Date | null): boolean {
  return !lastEventAt || occurredAt.getTime() >= lastEventAt.getTime();
}
