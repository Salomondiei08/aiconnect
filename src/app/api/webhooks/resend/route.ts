import { handleResendWebhook } from "@/lib/email/webhook";

/** Webhook Resend : le corps brut est lu tel quel pour vérifier la signature Svix. */
export async function POST(request: Request) {
  const raw = await request.text();
  const outcome = await handleResendWebhook(raw, {
    id: request.headers.get("svix-id"),
    timestamp: request.headers.get("svix-timestamp"),
    signature: request.headers.get("svix-signature"),
  });
  return new Response(outcome.body, { status: outcome.status });
}
