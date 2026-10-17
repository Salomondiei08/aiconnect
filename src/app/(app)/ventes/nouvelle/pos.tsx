"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, FileDown, Minus, Plus, Search, Send, Trash2 } from "lucide-react";
import { FormField, FormNotice } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { checkoutAction, sendInvoiceAction, type SaleResult } from "@/lib/actions/sales";
import { formatXof } from "@/lib/utils";

export type PosProduct = { id: string; name: string; salePrice: number; stockQty: number };

/** Caisse : tuiles produits, panier, encaissement espèces, puis reçu PDF et envoi par e-mail. */
export function Pos({ products }: { products: PosProduct[] }) {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Extract<SaleResult, { ok: true }> | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;
  }, [products, query]);
  const lines = products.filter((p) => cart[p.id]).map((p) => ({ ...p, qty: cart[p.id] }));
  const total = lines.reduce((s, l) => s + l.qty * l.salePrice, 0);

  const add = (p: PosProduct, delta = 1) =>
    setCart((c) => {
      const qty = Math.min(Math.max((c[p.id] ?? 0) + delta, 0), p.stockQty);
      const next = { ...c, [p.id]: qty };
      if (!qty) delete next[p.id];
      return next;
    });

  const validate = () =>
    startTransition(async () => {
      setError(null);
      const result = await checkoutAction(lines.map((l) => ({ productId: l.id, qty: l.qty })));
      if (result.ok) {
        setDone(result);
        setCart({});
        setPaying(false);
      } else setError(result.error);
    });

  if (done) return <SaleDone sale={done} onNew={() => setDone(null)} />;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <section aria-label="Produits">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input type="search" aria-label="Rechercher un produit" placeholder="Rechercher un produit" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
        </div>
        {visible.length ? (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visible.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  data-testid="product-tile"
                  onClick={() => add(p)}
                  disabled={p.stockQty <= (cart[p.id] ?? 0)}
                  className="flex min-h-24 w-full flex-col justify-between rounded-2xl border border-line bg-surface p-3 text-left transition hover:border-spark focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:opacity-50"
                >
                  <span className="text-sm font-semibold leading-snug">{p.name}</span>
                  <span className="mt-2 flex items-end justify-between gap-2 text-xs text-muted">
                    <span className="tabular text-sm font-semibold text-ink">{formatXof(p.salePrice)}</span>
                    <span className="tabular">Stock {p.stockQty}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-sm text-muted">{products.length ? "Aucun produit ne correspond." : "Ajoutez d'abord des produits dans le catalogue."}</p>
        )}
      </section>

      <aside aria-label="Panier" className="h-fit rounded-[1.25rem] border border-line bg-surface p-5 lg:sticky lg:top-24">
        <h2 className="font-semibold">Panier</h2>
        {lines.length ? (
          <ul className="mt-3 divide-y divide-line">
            {lines.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate">{l.name}</span>
                <span className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" aria-label={`Retirer un ${l.name}`} onClick={() => add(l, -1)}>{l.qty > 1 ? <Minus aria-hidden /> : <Trash2 aria-hidden />}</Button>
                  <span className="tabular w-6 text-center font-semibold">{l.qty}</span>
                  <Button size="icon" variant="ghost" aria-label={`Ajouter un ${l.name}`} onClick={() => add(l)} disabled={l.qty >= l.stockQty}><Plus aria-hidden /></Button>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">Touchez un produit pour l&apos;ajouter.</p>
        )}
        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
          <span className="text-sm text-muted">Total</span>
          <span data-testid="cart-total" className="tabular text-2xl font-semibold">{formatXof(total)}</span>
        </div>
        {error ? <div className="mt-3"><FormNotice tone="error">{error}</FormNotice></div> : null}
        {paying ? (
          <div className="mt-4 space-y-3">
            <FormField id="payment" label="Mode de paiement">
              <NativeSelect id="payment" defaultValue="cash">
                <option value="cash">Espèces</option>
              </NativeSelect>
            </FormField>
            <Button className="w-full" variant="spark" size="lg" onClick={validate} disabled={pending || !lines.length}>
              {pending ? "Enregistrement..." : "Valider le paiement"}
            </Button>
            <Button className="w-full" variant="secondary" onClick={() => setPaying(false)}>Annuler</Button>
          </div>
        ) : (
          <Button className="mt-4 w-full" size="lg" onClick={() => setPaying(true)} disabled={!lines.length}>Encaisser</Button>
        )}
      </aside>
    </div>
  );
}

function SaleDone({ sale, onNew }: { sale: Extract<SaleResult, { ok: true }>; onNew: () => void }) {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const send = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => setNotice(await sendInvoiceAction(sale.saleId, email)));
  };
  return (
    <div className="mx-auto max-w-lg space-y-5 rounded-[1.25rem] border border-line bg-surface p-6">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-moss" aria-hidden />
        <div>
          <p role="status" className="text-lg font-semibold">Vente enregistrée</p>
          <p className="text-sm text-muted">Facture {sale.number} · <span className="tabular">{formatXof(sale.total)}</span> en espèces</p>
        </div>
      </div>
      <a href={`/api/ventes/${sale.saleId}/facture`} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold hover:bg-sunken">
        <FileDown className="size-4" aria-hidden /> Télécharger la facture (PDF)
      </a>
      <form onSubmit={send} className="space-y-3 border-t border-line pt-5">
        <FormField id="customerEmail" label="E-mail du client">
          <Input id="customerEmail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
        </FormField>
        {notice ? <FormNotice tone={notice.ok ? "success" : "error"}>{notice.message}</FormNotice> : null}
        <Button type="submit" variant="secondary" disabled={pending || !email}><Send aria-hidden /> {pending ? "Envoi..." : "Envoyer la facture"}</Button>
      </form>
      <Button variant="spark" size="lg" className="w-full" onClick={onNew}>Nouvelle vente</Button>
    </div>
  );
}
