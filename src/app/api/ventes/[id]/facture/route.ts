import { getCurrentUser } from "@/lib/auth/session";
import { loadInvoice, renderInvoicePdf } from "@/lib/invoice";
import { invoiceNumber } from "@/lib/invoice-number";

/** Facture PDF d'une vente de l'entreprise connectée (404 sinon, sans révéler si la vente existe ailleurs). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Non connecté", { status: 401 });
  const { id } = await params;
  const sale = await loadInvoice(id, user.companyId);
  if (!sale) return new Response("Introuvable", { status: 404 });
  const pdf = await renderInvoicePdf(sale);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="facture-${invoiceNumber(sale.number)}.pdf"`,
      "cache-control": "private, no-store",
    },
  });
}
