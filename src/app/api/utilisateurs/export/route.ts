import writeExcelFile from "write-excel-file/node";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { can } from "@/lib/roles";
import { filterUsers, parseColumns, sortUsers, toCsv, USER_COLUMNS, type UserColumn, type UserListRow } from "@/lib/user-list";

/** Les polices standard PDF ne couvrent que le latin-1. */
const latin1 = (t: string) => t.replace(/[’‘]/g, "'").replace(/[^\x20-\x7e\xa0-\xff]/g, "?");

async function toPdf(rows: UserListRow[], cols: UserColumn[], company: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const width = 841.89;
  const colWidth = (width - 80) / cols.length;
  let page = pdf.addPage([width, 595.28]);
  let y = 545;
  const line = (cells: string[], f = font) => {
    cells.forEach((c, i) => {
      let text = latin1(c);
      while (text && f.widthOfTextAtSize(text, 9) > colWidth - 8) text = text.slice(0, -1);
      page.drawText(text, { x: 40 + i * colWidth, y, size: 9, font: f, color: rgb(0.08, 0.13, 0.23) });
    });
    y -= 16;
  };
  page.drawText(latin1(`Utilisateurs - ${company}`), { x: 40, y: 560, size: 14, font: bold });
  y = 530;
  const header = cols.map((c) => USER_COLUMNS.find((x) => x.key === c)!.label);
  line(header, bold);
  for (const r of rows) {
    if (y < 40) {
      page = pdf.addPage([width, 595.28]);
      y = 555;
      line(header, bold);
    }
    line(cols.map((c) => r[c]));
  }
  return pdf.save();
}

/** Export de la liste (CSV, Excel, PDF) : colonnes visibles et filtre en cours, sans la colonne Action (RG8). */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Non connecté", { status: 401 });
  if (!can.manageUsers(user)) return new Response("Accès refusé", { status: 403 });

  const url = new URL(request.url);
  const format = url.searchParams.get("format") ?? "csv";
  const cols = parseColumns(url.searchParams.get("cols"));
  const sort = (url.searchParams.get("sort") as UserColumn) || "username";
  const dir = url.searchParams.get("dir") === "desc" ? "desc" : "asc";

  const [company, users] = await Promise.all([
    db.company.findUniqueOrThrow({ where: { id: user.companyId }, select: { name: true } }),
    db.user.findMany({ where: { companyId: user.companyId } }),
  ]);
  const all = users.map((u) => ({ username: u.username, name: [u.prefix, u.firstName, u.lastName].filter(Boolean).join(" "), role: u.role, email: u.email }));
  const rows = sortUsers(filterUsers(all, url.searchParams.get("q") ?? "", cols), USER_COLUMNS.some((c) => c.key === sort) ? sort : "username", dir);
  const headers = (type: string, ext: string) => ({ "content-type": type, "content-disposition": `attachment; filename="utilisateurs.${ext}"`, "cache-control": "private, no-store" });

  if (format === "xlsx") {
    const header = cols.map((c) => ({ value: USER_COLUMNS.find((x) => x.key === c)!.label, fontWeight: "bold" as const }));
    const buffer = await writeExcelFile([header, ...rows.map((r) => cols.map((c) => ({ value: r[c] })))]).toBuffer();
    return new Response(new Uint8Array(buffer), { headers: headers("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx") });
  }
  if (format === "pdf") return new Response(new Uint8Array(await toPdf(rows, cols, company.name)), { headers: headers("application/pdf", "pdf") });
  return new Response(toCsv(rows, cols), { headers: headers("text/csv; charset=utf-8", "csv") });
}
