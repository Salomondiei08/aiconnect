"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { FormField, FormNotice } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createProductAction } from "@/lib/actions/products";
import type { FormState } from "@/lib/actions/form";

/** Bouton « Ajouter un produit » qui déplie le formulaire au-dessus de la liste (?ajouter=1 l'ouvre directement). */
export function ProductForm({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  // Succès : on referme le formulaire et on confirme ; le formulaire est remis à zéro par React.
  const [state, formAction, pending] = useActionState<FormState, FormData>(async (prev, formData) => {
    const result = await createProductAction(prev, formData);
    if (result.success) {
      toast.success(result.success);
      setOpen(false);
    }
    return result;
  }, {});
  const errors = state.errors ?? {};
  const values = state.values ?? {};

  if (!open) {
    return <Button onClick={() => setOpen(true)}><Plus aria-hidden /> Ajouter un produit</Button>;
  }
  return (
    <form action={formAction} noValidate className="w-full rounded-[1.25rem] border border-line bg-surface p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Nouveau produit</h2>
        <Button type="button" variant="ghost" size="icon" aria-label="Fermer" onClick={() => setOpen(false)}><X aria-hidden /></Button>
      </div>
      {state.message ? <div className="mb-4"><FormNotice tone="error">{state.message}</FormNotice></div> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FormField id="name" label="Nom du produit" required error={errors.name} className="sm:col-span-2 lg:col-span-3">
          <Input id="name" name="name" maxLength={150} defaultValue={values.name} aria-invalid={!!errors.name} />
        </FormField>
        <FormField id="purchasePrice" label="Prix d'achat" required hint="En FCFA" error={errors.purchasePrice}>
          <Input id="purchasePrice" name="purchasePrice" type="number" inputMode="numeric" min={0} defaultValue={values.purchasePrice} aria-invalid={!!errors.purchasePrice} />
        </FormField>
        <FormField id="salePrice" label="Prix de vente" required hint="En FCFA" error={errors.salePrice}>
          <Input id="salePrice" name="salePrice" type="number" inputMode="numeric" min={0} defaultValue={values.salePrice} aria-invalid={!!errors.salePrice} />
        </FormField>
        <FormField id="stockQty" label="Quantité initiale" required error={errors.stockQty}>
          <Input id="stockQty" name="stockQty" type="number" inputMode="numeric" min={0} defaultValue={values.stockQty} aria-invalid={!!errors.stockQty} />
        </FormField>
        <FormField id="minStock" label="Stock minimum" hint="Alerte de stock bas sous ce seuil" error={errors.minStock}>
          <Input id="minStock" name="minStock" type="number" inputMode="numeric" min={0} defaultValue={values.minStock} />
        </FormField>
      </div>
      <div className="mt-5 flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Enregistrement..." : "Sauvegarder"}</Button>
      </div>
    </form>
  );
}
