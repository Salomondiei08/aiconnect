import "server-only";
import { db } from "@/lib/db";
import { can } from "@/lib/roles";
import type { User } from "@/generated/prisma/client";

export type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;

/**
 * Indicateurs du tableau de bord, calculés en base pour l'entreprise de la session.
 * Achats, dépenses et factures impayées n'ont pas encore de module : ils valent 0 dans ce lot.
 * Net = ventes - coût d'achat des articles vendus (marge brute) ; formule à valider avec le comptable.
 */
export async function loadDashboard(user: User) {
  const saleScope = { companyId: user.companyId, ...(can.seeAllSales(user) ? {} : { userId: user.id }) };
  const [sales, soldItems, lowStock, recent] = await Promise.all([
    db.sale.aggregate({ where: saleScope, _sum: { total: true }, _count: true }),
    db.saleItem.findMany({ where: { sale: saleScope }, select: { qty: true, product: { select: { purchasePrice: true } } } }),
    db.product.findMany({
      where: { companyId: user.companyId, stockQty: { lte: db.product.fields.minStock } },
      orderBy: { stockQty: "asc" },
      take: 5,
      select: { id: true, name: true, stockQty: true, minStock: true },
    }),
    db.sale.findMany({ where: saleScope, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, number: true, total: true, createdAt: true } }),
  ]);
  const totalSales = sales._sum.total ?? 0;
  const costOfGoods = soldItems.reduce((sum, i) => sum + i.qty * i.product.purchasePrice, 0);
  return {
    saleCount: sales._count,
    kpis: {
      totalSales,
      unpaidInvoices: 0,
      totalPurchases: 0,
      totalExpenses: 0,
      net: totalSales - costOfGoods,
    },
    lowStock,
    recent,
  };
}
