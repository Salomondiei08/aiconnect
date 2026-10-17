export type CartLine = { productId: string; qty: number };

export class SaleError extends Error {}

/** Regroupe les lignes d'un même produit et écarte les quantités invalides. */
export function mergeLines(lines: CartLine[]): CartLine[] {
  const byId = new Map<string, number>();
  for (const l of lines) {
    if (!Number.isInteger(l.qty) || l.qty <= 0 || l.qty > 100_000) throw new SaleError("Quantité invalide");
    byId.set(l.productId, (byId.get(l.productId) ?? 0) + l.qty);
  }
  return [...byId].map(([productId, qty]) => ({ productId, qty }));
}
