import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { can } from "@/lib/roles";
import type { SessionUser } from "@/lib/auth/session";

export type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;

export const PERIODS = [
  { days: 7, label: "7 jours" },
  { days: 30, label: "30 jours" },
  { days: 90, label: "90 jours" },
] as const;

export type Period = (typeof PERIODS)[number]["days"];

export function normalizePeriod(value: string | undefined): Period {
  const days = Number(value);
  return PERIODS.some((p) => p.days === days) ? (days as Period) : 30;
}

type DayRow = { day: Date; revenue: number; sales: bigint | number };

/**
 * Indicateurs du tableau de bord, calculés en base pour l'entreprise de la session.
 * Achats, dépenses et factures impayées n'ont pas encore de module : ils valent 0 dans ce lot.
 * Net = ventes - coût d'achat des articles vendus (marge brute) ; formule à valider avec le comptable.
 * Un caissier ne voit que ses propres ventes (portée appliquée à toutes les séries).
 */
export async function loadDashboard(user: SessionUser, days: Period = 30) {
  const saleScope = { companyId: user.companyId, ...(can.seeAllSales(user) ? {} : { userId: user.id }) };
  const since = startOfDayUtc(days);
  const timezone = user.company.timezone || "Africa/Abidjan";

  const [sales, soldItems, lowStock, recent, products, topItems, dailyRows, stockAlerts] = await Promise.all([
    db.sale.aggregate({ where: saleScope, _sum: { total: true }, _count: true }),
    db.saleItem.findMany({ where: { sale: saleScope }, select: { qty: true, product: { select: { purchasePrice: true } } } }),
    db.product.findMany({
      where: { companyId: user.companyId, stockQty: { lte: db.product.fields.minStock } },
      orderBy: { stockQty: "asc" },
      take: 5,
      select: { id: true, name: true, stockQty: true, minStock: true },
    }),
    db.sale.findMany({
      where: saleScope,
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, number: true, total: true, createdAt: true, items: { select: { qty: true } } },
    }),
    db.product.findMany({ where: { companyId: user.companyId }, select: { stockQty: true, purchasePrice: true, salePrice: true } }),
    db.saleItem.groupBy({
      by: ["productId"],
      where: { sale: saleScope },
      _sum: { qty: true, total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
    db.$queryRaw<DayRow[]>(
      Prisma.sql`
        SELECT date_trunc('day', "Sale"."createdAt" AT TIME ZONE ${timezone}) AS day,
               COALESCE(SUM("Sale"."total"), 0)::int AS revenue,
               COUNT(*)::int AS sales
        FROM "Sale"
        WHERE "Sale"."companyId" = ${user.companyId}
          ${can.seeAllSales(user) ? Prisma.empty : Prisma.sql`AND "Sale"."userId" = ${user.id}`}
          AND "Sale"."createdAt" >= ${since}
        GROUP BY 1
        ORDER BY 1`,
    ),
    db.product.count({ where: { companyId: user.companyId, stockQty: { lte: db.product.fields.minStock } } }),
  ]);

  const totalSales = sales._sum.total ?? 0;
  const costOfGoods = soldItems.reduce((sum, i) => sum + i.qty * i.product.purchasePrice, 0);

  const topNames = await db.product.findMany({
    where: { id: { in: topItems.map((t) => t.productId) }, companyId: user.companyId },
    select: { id: true, name: true },
  });

  // Série continue : les jours sans vente apparaissent à 0 pour que la courbe reste lisible.
  const byDay = new Map(dailyRows.map((row) => [dayKey(row.day), { revenue: Number(row.revenue), count: Number(row.sales) }]));
  const series = Array.from({ length: days }, (_, index) => {
    const date = new Date(since.getTime() + index * 86_400_000);
    const key = dayKey(date);
    return {
      key,
      date,
      label: shortLabel(date, days),
      revenue: byDay.get(key)?.revenue ?? 0,
      count: byDay.get(key)?.count ?? 0,
    };
  });

  const periodRevenue = series.reduce((sum, point) => sum + point.revenue, 0);
  const periodCount = series.reduce((sum, point) => sum + point.count, 0);
  const halfway = Math.floor(series.length / 2);
  const firstHalf = series.slice(0, halfway).reduce((sum, p) => sum + p.revenue, 0);
  const secondHalf = series.slice(halfway).reduce((sum, p) => sum + p.revenue, 0);
  const trend = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : secondHalf > 0 ? 100 : 0;
  const bestDay = series.reduce<{ label: string; revenue: number } | null>(
    (best, point) => (!best || point.revenue > best.revenue ? { label: point.label, revenue: point.revenue } : best),
    null,
  );
  const averageBasket = periodCount ? Math.round(periodRevenue / periodCount) : 0;

  return {
    saleCount: sales._count,
    period: days,
    kpis: {
      totalSales,
      unpaidInvoices: 0,
      totalPurchases: 0,
      totalExpenses: 0,
      net: totalSales - costOfGoods,
    },
    trend: { periodRevenue, periodCount, trend, averageBasket, bestDay },
    series,
    stock: {
      references: products.length,
      units: products.reduce((sum, p) => sum + p.stockQty, 0),
      purchaseValue: products.reduce((sum, p) => sum + p.stockQty * p.purchasePrice, 0),
      retailValue: products.reduce((sum, p) => sum + p.stockQty * p.salePrice, 0),
      alerts: stockAlerts,
    },
    topProducts: topItems.map((item) => ({
      id: item.productId,
      name: topNames.find((p) => p.id === item.productId)?.name ?? "Produit retiré",
      revenue: item._sum.total ?? 0,
      qty: item._sum.qty ?? 0,
    })),
    lowStock,
    recent,
  };
}

function startOfDayUtc(days: number): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - (days - 1));
  return date;
}

/** Clé de jour stable, indépendante du fuseau du serveur. */
function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Étiquette d'axe : « 12 » sur une semaine, « 12 mars » au-delà. */
function shortLabel(date: Date, days: number): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "UTC",
    day: "numeric",
    ...(days > 10 ? { month: "short" } : {}),
  }).format(date);
}
