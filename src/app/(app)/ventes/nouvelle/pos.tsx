"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, FileDown, Minus, Plus, Search, Send, ShoppingBasket, Trash2 } from "lucide-react";
import { AnimatedXof } from "@/components/motion/animated-number";
import { Badge } from "@/components/ui/badge";
import { FormField, FormNotice } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { checkoutAction, sendInvoiceAction, type SaleResult } from "@/lib/actions/sales";
import { cn, formatXof } from "@/lib/utils";

export type PosProduct = { id: string; name: string; salePrice: number; stockQty: number };

/** Caisse : tuiles produits, panier, encaissement espèces, puis reçu PDF et envoi par e-mail. */
export function Pos({ products }: { products: PosProduct[] }) {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Extract<SaleResult, { ok: true }> | null>(null);
  const [bump, setBump] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;
  }, [products, query]);
  const lines = products.filter((p) => cart[p.id]).map((p) => ({ ...p, qty: cart[p.id] }));
  const total = lines.reduce((s, l) => s + l.qty * l.salePrice, 0);
  const itemCount = lines.reduce((s, l) => s + l.qty, 0);

  const add = (p: PosProduct, delta = 1) =>
    setCart((c) => {
      const qty = Math.min(Math.max((c[p.id] ?? 0) + delta, 0), p.stockQty);
      const next = { ...c, [p.id]: qty };
      if (!qty) delete next[p.id];
      return next;
    });

  /** Retour visuel au toucher : la tuile rebondit et son badge se met à jour. */
  const tap = (p: PosProduct) => {
    add(p);
    setBump(p.id);
    window.setTimeout(() => setBump((current) => (current === p.id ? null : current)), 260);
  };

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
          <Input
            type="search"
            aria-label="Rechercher un produit"
            placeholder="Rechercher un produit"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {visible.length ? (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visible.map((p, index) => {
              const inCart = cart[p.id] ?? 0;
              const full = p.stockQty <= inCart;
              return (
                <li key={p.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(index * 18, 300)}ms` }}>
                  <button
                    type="button"
                    data-testid="product-tile"
                    onClick={() => tap(p)}
                    disabled={full}
                    className={cn(
                      "relative flex min-h-24 w-full flex-col justify-between overflow-hidden rounded-2xl border bg-surface p-3 text-left transition-all duration-200",
                      "hover:-translate-y-0.5 hover:border-spark hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:opacity-50 disabled:hover:translate-y-0",
                      inCart ? "border-spark shadow-[var(--shadow-glow)]" : "border-line",
                      bump === p.id && "animate-pop",
                    )}
                  >
                    {inCart ? (
                      <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-spark-fill text-[11px] font-bold text-on-spark animate-pop">
                        {inCart}
                      </span>
                    ) : null}
                    <span className="pr-7 text-sm font-semibold leading-snug">{p.name}</span>
                    <span className="mt-2 flex items-end justify-between gap-2 text-xs text-muted">
                      <span className="tabular text-sm font-semibold text-ink">{formatXof(p.salePrice)}</span>
                      <span className={cn("tabular", p.stockQty <= 5 && "font-semibold text-ochre")}>Stock {p.stockQty}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-6 text-sm text-muted">{products.length ? "Aucun produit ne correspond." : "Ajoutez d'abord des produits dans le catalogue."}</p>
        )}
      </section>

      <aside aria-label="Panier" className="h-fit rounded-[1.25rem] border border-line bg-surface p-5 shadow-[var(--shadow-xs)] lg:sticky lg:top-24">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-semibold">
            <ShoppingBasket className="size-[18px] text-spark" aria-hidden />
            Panier
          </h2>
          {itemCount ? <Badge tone="spark">{itemCount} article(s)</Badge> : null}
        </div>
        {lines.length ? (
          <ul className="mt-3 divide-y divide-line">
            {lines.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 py-2 text-sm animate-slide-in-right">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{l.name}</span>
                  <span className="tabular block text-xs text-muted">{formatXof(l.qty * l.salePrice)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" aria-label={`Retirer un ${l.name}`} onClick={() => add(l, -1)}>
                    {l.qty > 1 ? <Minus aria-hidden /> : <Trash2 aria-hidden />}
                  </Button>
                  <span className="tabular w-6 text-center font-semibold">{l.qty}</span>
                  <Button size="icon" variant="ghost" aria-label={`Ajouter un ${l.name}`} onClick={() => add(l)} disabled={l.qty >= l.stockQty}>
                    <Plus aria-hidden />
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">Touchez un produit pour l&apos;ajouter.</p>
        )}
        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
          <span className="text-sm text-muted">Total</span>
          <span data-testid="cart-total" className="tabular text-2xl font-semibold">
            <AnimatedXof value={total} />
          </span>
        </div>
        {error ? (
          <div className="mt-3">
            <FormNotice tone="error">{error}</FormNotice>
          </div>
        ) : null}
        {paying ? (
          <div className="mt-4 space-y-3 animate-fade-up">
            <FormField id="payment" label="Mode de paiement">
              <NativeSelect id="payment" defaultValue="cash">
                <option value="cash">Espèces</option>
              </NativeSelect>
            </FormField>
            <Button className="sweep w-full" variant="spark" size="lg" onClick={validate} disabled={pending || !lines.length}>
              {pending ? "Enregistrement..." : "Valider le paiement"}
            </Button>
            <Button className="w-full" variant="secondary" onClick={() => setPaying(false)}>
              Annuler
            </Button>
          </div>
        ) : (
          <Button className="sweep mt-4 w-full shadow-[var(--shadow-glow)]" size="lg" onClick={() => setPaying(true)} disabled={!lines.length}>
            Encaisser
          </Button>
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
    <div className="mx-auto max-w-lg space-y-5 rounded-[1.25rem] border border-line bg-surface p-6 shadow-[var(--shadow-md)] animate-scale-in">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-moss-soft text-moss animate-pop">
          <CheckCircle2 className="size-6" aria-hidden />
        </span>
        <div>
          <p role="status" className="text-lg font-semibold">
            Vente enregistrée
          </p>
          <p className="text-sm text-muted">
            Facture {sale.number} · <span className="tabular">{formatXof(sale.total)}</span> en espèces
          </p>
        </div>
      </div>
      <a
        href={`/api/ventes/${sale.saleId}/facture`}
        target="_blank"
        rel="noopener"
        className="card-lift inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-line px-5 text-sm font-semibold hover:border-spark/40 sm:w-auto"
      >
        <FileDown className="size-4" aria-hidden /> Télécharger la facture (PDF)
      </a>
      <form onSubmit={send} className="space-y-3 border-t border-line pt-5">
        <FormField id="customerEmail" label="E-mail du client">
          <Input id="customerEmail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
        </FormField>
        {notice ? <FormNotice tone={notice.ok ? "success" : "error"}>{notice.message}</FormNotice> : null}
        <Button type="submit" variant="secondary" disabled={pending || !email}>
          <Send aria-hidden /> {pending ? "Envoi..." : "Envoyer la facture"}
        </Button>
      </form>
      <Button variant="spark" size="lg" className="sweep w-full" onClick={onNew}>
        Nouvelle vente
      </Button>
    </div>
  );
}
