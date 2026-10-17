import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { Pos } from "./pos";

export const metadata: Metadata = { title: "Nouvelle vente" };

export default async function NewSalePage() {
  const user = await requireUser();
  const products = await db.product.findMany({
    where: { companyId: user.companyId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, salePrice: true, stockQty: true },
  });
  return (
    <div className="space-y-6">
      <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">Nouvelle vente</h1>
      <Pos products={products} />
    </div>
  );
}
