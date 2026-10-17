"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/roles";
import { fieldErrors } from "@/lib/validation";
import { keepValues, type FormState } from "./form";

const amount = (label: string) => z.coerce.number({ message: `${label} : nombre attendu` }).int(`${label} : nombre entier`).min(0, `${label} : 0 minimum`).max(1_000_000_000);

const productSchema = z.object({
  name: z.string().trim().min(1, "Le nom du produit est requis").max(150),
  purchasePrice: amount("Prix d'achat"),
  salePrice: amount("Prix de vente"),
  stockQty: amount("Quantité initiale"),
  minStock: z.preprocess((v) => (v === "" || v == null ? 0 : v), amount("Stock minimum")),
});

/** Crée un produit et son mouvement de stock initial dans une transaction. */
export async function createProductAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!can.manageProducts(user)) return { message: "Vous n'avez pas le droit d'ajouter des produits" };
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: keepValues(formData) };
  const d = parsed.data;
  await db.$transaction(async (tx) => {
    const product = await tx.product.create({ data: { ...d, companyId: user.companyId } });
    if (d.stockQty > 0) await tx.stockMovement.create({ data: { companyId: user.companyId, productId: product.id, type: "initial", qty: d.stockQty } });
  });
  revalidatePath("/produits");
  revalidatePath("/ventes/nouvelle");
  return { success: `Produit « ${d.name} » ajouté` };
}
