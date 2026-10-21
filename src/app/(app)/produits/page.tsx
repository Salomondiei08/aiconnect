import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { can } from "@/lib/roles";
import { ProductForm } from "./product-form";
import { ProductsExplorer } from "./products-explorer";

export const metadata: Metadata = { title: "Produits" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ ajouter?: string }> }) {
  const user = await requireUser();
  const { ajouter } = await searchParams;
  const products = await db.product.findMany({ where: { companyId: user.companyId }, orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">Produits</h1>
          <p className="mt-1 text-muted">{products.length} produit(s) en catalogue</p>
        </div>
      </div>
      {can.manageProducts(user) ? <ProductForm defaultOpen={ajouter === "1"} /> : null}
      <ProductsExplorer products={products} canManage={can.manageProducts(user)} />
    </div>
  );
}
