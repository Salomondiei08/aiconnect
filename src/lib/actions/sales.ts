"use server";

import { createElement } from "react";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { sendEmail } from "@/lib/email/send";
import { InvoiceEmail, invoiceText } from "@/lib/email/templates";
import { loadInvoice, renderInvoicePdf } from "@/lib/invoice";
import { invoiceNumber } from "@/lib/invoice-number";
import { recordSale, SaleError } from "@/lib/sales";
import { formatDate, formatXof } from "@/lib/utils";
import { emailSchema } from "@/lib/validation";

const cartSchema = z.array(z.object({ productId: z.string().min(1), qty: z.number().int() })).max(200);

export type SaleResult = { ok: true; saleId: string; number: string; total: number } | { ok: false; error: string };

/** Encaissement en espèces depuis la caisse. */
export async function checkoutAction(lines: unknown): Promise<SaleResult> {
  const user = await requireUser();
  const parsed = cartSchema.safeParse(lines);
  if (!parsed.success) return { ok: false, error: "Panier invalide" };
  try {
    const sale = await recordSale({ companyId: user.companyId, userId: user.id, lines: parsed.data });
    revalidatePath("/tableau-de-bord");
    revalidatePath("/produits");
    return { ok: true, saleId: sale.id, number: invoiceNumber(sale.number), total: sale.total };
  } catch (error) {
    if (error instanceof SaleError) return { ok: false, error: error.message };
    throw error;
  }
}

/** Envoie la facture PDF par e-mail. La vente doit appartenir à l'entreprise de la session. */
export async function sendInvoiceAction(saleId: string, email: string): Promise<{ ok: boolean; message: string }> {
  const user = await requireUser();
  const to = emailSchema.safeParse(email);
  if (!to.success) return { ok: false, message: "Adresse e-mail invalide" };
  const sale = await loadInvoice(saleId, user.companyId);
  if (!sale) return { ok: false, message: "Vente introuvable" };

  const number = invoiceNumber(sale.number);
  const props = { company: sale.company.name, number, date: formatDate(sale.createdAt, sale.company.timezone), total: formatXof(sale.total) };
  const result = await sendEmail({
    type: "invoice",
    to: to.data,
    subject: `Facture ${number} de ${sale.company.name}`,
    react: createElement(InvoiceEmail, props),
    text: invoiceText(props),
    companyId: user.companyId,
    attachments: [{ filename: `facture-${number}.pdf`, content: await renderInvoicePdf(sale), contentType: "application/pdf" }],
  });
  return result.ok
    ? { ok: true, message: `Facture envoyée à ${to.data}` }
    : { ok: false, message: `La facture n'a pas pu être envoyée : ${result.error}. Réessayez dans un instant.` };
}
