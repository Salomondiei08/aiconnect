import "server-only";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { isNewer, statusForEvent } from "./status";

type WebhookHeaders = { id: string | null; timestamp: string | null; signature: string | null };
type ResendEvent = { type: string; created_at: string; data?: { email_id?: string } };

export type WebhookOutcome = { status: 200 | 400 | 500; body: string };

/**
 * Traite un webhook Resend. La signature Svix est vérifiée sur le corps brut avant toute écriture.
 * L'identifiant svix-id est unique en base : un événement répété est accusé sans effet.
 */
export async function handleResendWebhook(rawBody: string, headers: WebhookHeaders): Promise<WebhookOutcome> {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return { status: 500, body: "webhook non configuré" };
  if (!headers.id || !headers.timestamp || !headers.signature) return { status: 400, body: "signature absente" };

  let event: ResendEvent;
  try {
    // verify() n'appelle pas l'API : la clé factice évite d'exiger RESEND_API_KEY ici.
    event = new Resend(process.env.RESEND_API_KEY ?? "re_unused").webhooks.verify({
      payload: rawBody,
      headers: { id: headers.id, timestamp: headers.timestamp, signature: headers.signature },
      webhookSecret: secret,
    }) as unknown as ResendEvent;
  } catch {
    return { status: 400, body: "signature invalide" };
  }

  const occurredAt = new Date(event.created_at);
  if (Number.isNaN(occurredAt.getTime())) return { status: 400, body: "date invalide" };
  const delivery = event.data?.email_id ? await db.emailDelivery.findUnique({ where: { resendId: event.data.email_id } }) : null;

  try {
    await db.emailWebhookEvent.create({
      data: { providerEventId: headers.id, type: event.type, occurredAt, emailDeliveryId: delivery?.id ?? null },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { status: 200, body: "déjà traité" };
    throw error;
  }

  const status = statusForEvent(event.type);
  if (delivery && status && isNewer(occurredAt, delivery.lastEventAt)) {
    // Condition répétée en base : deux événements simultanés ne s'écrasent pas dans le mauvais ordre.
    await db.emailDelivery.updateMany({
      where: { id: delivery.id, OR: [{ lastEventAt: null }, { lastEventAt: { lte: occurredAt } }] },
      data: { status, lastEventAt: occurredAt },
    });
  }
  return { status: 200, body: "ok" };
}
