import type { Metadata } from "next";
import { PackageOpen } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { can } from "@/lib/roles";
import { formatXof } from "@/lib/utils";
import { ProductForm } from "./product-form";

export const metadata: Metadata = { title: "Produits" };

export default async function ProductsPage() {
  const user = await requireUser();
  const products = await db.product.findMany({ where: { companyId: user.companyId }, orderBy: { name: "asc" } });
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">Produits</h1>
          <p className="mt-1 text-muted">{products.length} produit(s) en catalogue</p>
        </div>
      </div>
      {can.manageProducts(user) ? <ProductForm /> : null}
      {products.length ? (
        <div className="overflow-x-auto rounded-[1.25rem] border border-line bg-surface">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-sunken text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Produit</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Prix d&apos;achat</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Prix de vente</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => {
                const low = p.stockQty <= p.minStock;
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="tabular px-4 py-3 text-right">{formatXof(p.purchasePrice)}</td>
                    <td className="tabular px-4 py-3 text-right">{formatXof(p.salePrice)}</td>
                    <td className="px-4 py-3 text-right">
                      <span data-testid="stock-qty" className={`tabular inline-block rounded-full px-2.5 py-1 font-semibold ${low ? "bg-ochre-soft text-ochre" : ""}`}>
                        {p.stockQty}
                      </span>
                      {low ? <span className="sr-only">, stock bas</span> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-[1.25rem] border border-dashed border-field bg-surface p-8 text-center">
          <PackageOpen className="mx-auto size-8 text-muted" aria-hidden />
          <p className="mt-3 font-semibold">Aucun produit</p>
          <p className="mt-1 text-sm text-muted">Ajoutez votre premier produit pour commencer à vendre.</p>
        </div>
      )}
    </div>
  );
}
