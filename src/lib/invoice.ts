import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { db } from "@/lib/db";
import { formatDate, formatXof } from "@/lib/utils";
import { invoiceNumber } from "@/lib/invoice-number";

export type InvoiceData = Awaited<ReturnType<typeof loadInvoice>>;

/** Charge une vente avec ses lignes, uniquement si elle appartient à l'entreprise de la session. */
export async function loadInvoice(saleId: string, companyId: string) {
  return db.sale.findFirst({
    where: { id: saleId, companyId },
    include: { items: true, company: true, location: true },
  });
}

/** Les polices standard PDF (WinAnsi) ne couvrent pas tout Unicode : on remplace ce qu'elles ne savent pas dessiner. */
function safe(text: string): string {
  return text.replace(/[’‘]/g, "'").replace(/[“”«»]/g, '"').replace(/[  ]/g, " ").replace(/[^\x20-\x7e\xa0-\xff]/g, "?");
}

/** Facture PDF A4 générée côté serveur. */
export async function renderInvoicePdf(sale: NonNullable<InvoiceData>): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Facture ${invoiceNumber(sale.number)}`);
  const page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.08, 0.13, 0.23);
  const muted = rgb(0.33, 0.37, 0.42);
  const write = (text: string, x: number, y: number, size = 10, font = regular, color = ink) =>
    page.drawText(safe(text), { x, y, size, font, color });
  const right = (text: string, xRight: number, y: number, size = 10, font = regular) =>
    write(text, xRight - font.widthOfTextAtSize(safe(text), size), y, size, font);

  const { company } = sale;
  write(company.name, 50, 780, 18, bold);
  write([company.commune, company.city, company.country].filter(Boolean).join(", "), 50, 760, 10, regular, muted);
  if (company.tax1Name && company.tax1Number) write(`${company.tax1Name} : ${company.tax1Number}`, 50, 746, 10, regular, muted);

  right("FACTURE", 545, 780, 18, bold);
  right(invoiceNumber(sale.number), 545, 760);
  right(`Date : ${formatDate(sale.createdAt, company.timezone)}`, 545, 746);
  right(`Point de vente : ${sale.location.name}`, 545, 732);

  let y = 680;
  page.drawRectangle({ x: 50, y: y - 6, width: 495, height: 22, color: rgb(0.95, 0.95, 0.93) });
  write("Article", 58, y, 10, bold);
  right("Qté", 360, y, 10, bold);
  right("Prix unitaire", 450, y, 10, bold);
  right("Total", 537, y, 10, bold);
  y -= 26;
  for (const item of sale.items) {
    write(item.name.slice(0, 50), 58, y);
    right(String(item.qty), 360, y);
    right(formatXof(item.unitPrice), 450, y);
    right(formatXof(item.total), 537, y);
    y -= 20;
  }
  page.drawLine({ start: { x: 50, y: y + 6 }, end: { x: 545, y: y + 6 }, thickness: 0.5, color: muted });
  y -= 14;
  right("Total payé", 450, y, 12, bold);
  right(formatXof(sale.total), 537, y, 12, bold);
  write(`Paiement : ${sale.paymentMethod === "cash" ? "Espèces" : sale.paymentMethod}`, 50, y, 10, regular, muted);
  write("Merci de votre confiance.", 50, 60, 10, regular, muted);

  return Buffer.from(await pdf.save());
}
