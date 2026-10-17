import { db } from "@/lib/db";

/** Santé pour Docker et Caddy : l'application répond et PostgreSQL aussi. */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
