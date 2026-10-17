import "server-only";
import type { ReactElement } from "react";
import { render } from "@react-email/render";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { EmailSendError, sendWithRetry } from "./retry";

export type EmailType = "welcome" | "email_verification" | "password_reset" | "password_changed" | "invoice";

type Attachment = { filename: string; content: Buffer; contentType: string };

type SendInput = {
  type: EmailType;
  to: string;
  subject: string;
  react: ReactElement;
  /** Version texte écrite à la main : liens nus, lisibles et copiables. */
  text: string;
  companyId?: string | null;
  attachments?: Attachment[];
};

export type SendResult = { ok: true; deliveryId: string; resendId: string } | { ok: false; deliveryId: string; error: string };

let client: Resend | undefined;
function resend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new EmailSendError("RESEND_API_KEY manquant", 0, false);
  client ??= new Resend(key);
  return client;
}

/**
 * Envoie un e-mail transactionnel via Resend et le journalise.
 * La ligne est créée avant l'appel ; son id sert de clé d'idempotence, donc une reprise ne duplique pas l'envoi.
 * « sent » veut dire accepté par Resend : la livraison n'est confirmée que par webhook.
 */
export async function sendEmail(input: SendInput): Promise<SendResult> {
  const delivery = await db.emailDelivery.create({
    data: {
      type: input.type,
      to: input.to,
      subject: input.subject,
      companyId: input.companyId ?? null,
      idempotencyKey: crypto.randomUUID(),
      attachments: input.attachments?.map((a) => ({ filename: a.filename, size: a.content.length, contentType: a.contentType })),
    },
  });

  try {
    const from = process.env.RESEND_FROM_EMAIL;
    if (!from) throw new EmailSendError("RESEND_FROM_EMAIL manquant", 0, false);
    const html = await render(input.react);
    const { id, attempts } = await sendWithRetry(() =>
      resend().emails.send(
        {
          from,
          to: input.to,
          subject: input.subject,
          html,
          text: input.text,
          attachments: input.attachments?.map((a) => ({ filename: a.filename, content: a.content, contentType: a.contentType })),
          tags: [{ name: "type", value: input.type }],
        },
        { idempotencyKey: delivery.idempotencyKey },
      ),
    );
    await db.emailDelivery.update({ where: { id: delivery.id }, data: { status: "sent", resendId: id, attempts, error: null } });
    return { ok: true, deliveryId: delivery.id, resendId: id };
  } catch (thrown) {
    const error = thrown instanceof EmailSendError ? thrown : new EmailSendError("Erreur inattendue pendant l'envoi", 1, false);
    await db.emailDelivery.update({ where: { id: delivery.id }, data: { status: "failed", attempts: error.attempts, error: error.message } });
    console.error(`[email] échec ${input.type} delivery=${delivery.id}: ${error.message}`);
    return { ok: false, deliveryId: delivery.id, error: error.message };
  }
}
