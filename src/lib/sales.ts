import "server-only";
import { db } from "@/lib/db";
import { mergeLines, SaleError, type CartLine } from "./sales-lines";

export { SaleError };

/**
 * Enregistre une vente : lignes, décrément du stock et mouvements dans une seule transaction.
 * Le décrément est conditionnel (stock >= quantité) : deux caisses simultanées ne peuvent pas passer le stock en négatif.
 */
export async function recordSale(input: { companyId: string; userId: string; lines: CartLine[] }) {
  const lines = mergeLines(input.lines);
  if (!lines.length) throw new SaleError("Le panier est vide");

  return db.$transaction(async (tx) => {
    const products = await tx.product.findMany({ where: { companyId: input.companyId, id: { in: lines.map((l) => l.productId) } } });
    if (products.length !== lines.length) throw new SaleError("Produit introuvable");
    const location = await tx.location.findFirstOrThrow({ where: { companyId: input.companyId }, orderBy: { code: "asc" } });

    const items = lines.map((l) => {
      const p = products.find((x) => x.id === l.productId)!;
      return { productId: p.id, name: p.name, qty: l.qty, unitPrice: p.salePrice, total: p.salePrice * l.qty };
    });
    for (const item of items) {
      const updated = await tx.product.updateMany({ where: { id: item.productId, companyId: input.companyId, stockQty: { gte: item.qty } }, data: { stockQty: { decrement: item.qty } } });
      if (updated.count !== 1) throw new SaleError(`Stock insuffisant pour « ${item.name} »`);
    }

    const last = await tx.sale.findFirst({ where: { companyId: input.companyId }, orderBy: { number: "desc" }, select: { number: true } });
    const sale = await tx.sale.create({
      data: {
        companyId: input.companyId,
        locationId: location.id,
        userId: input.userId,
        number: (last?.number ?? 0) + 1,
        total: items.reduce((s, i) => s + i.total, 0),
        paymentMethod: "cash",
        items: { create: items },
      },
    });
    await tx.stockMovement.createMany({
      data: items.map((i) => ({ companyId: input.companyId, productId: i.productId, saleId: sale.id, type: "sale", qty: -i.qty })),
    });
    return sale;
  });
}
