"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, PackageOpen, Search } from "lucide-react";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { cn, formatXof } from "@/lib/utils";

/** Indicateur de tri d'une colonne : neutre, croissant ou décroissant. */
function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  const Icon = active ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return <Icon className={cn("size-3.5", active ? "text-spark" : "opacity-45")} aria-hidden />;
}

export type ProductRow = { id: string; name: string; purchasePrice: number; salePrice: number; stockQty: number; minStock: number };

type SortKey = "name" | "stockQty" | "salePrice" | "margin";
type FilterKey = "all" | "low" | "out";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "low", label: "Stock bas" },
  { key: "out", label: "Rupture" },
];

/** Marge brute unitaire en pourcentage (0 si le prix d'achat est nul). */
function marginOf(product: ProductRow): number {
  if (product.salePrice <= 0) return 0;
  return Math.round(((product.salePrice - product.purchasePrice) / product.salePrice) * 100);
}

function sortValue(product: ProductRow, key: SortKey): string | number {
  switch (key) {
    case "stockQty":
      return product.stockQty;
    case "salePrice":
      return product.salePrice;
    case "margin":
      return marginOf(product);
    default:
      return product.name;
  }
}

/**
 * Catalogue interactif : recherche instantanée, filtres d'état de stock, tri par colonne,
 * et valeur du stock recalculée sur la sélection. Le tableau reste un vrai <table>
 * avec la cellule de stock marquée `data-testid="stock-qty"` (contrat d'acceptation).
 */
export function ProductsExplorer({ products, canManage }: { products: ProductRow[]; canManage: boolean }) {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [sort, setSort] = React.useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "name", dir: "asc" });

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (filter === "low") return p.stockQty <= p.minStock && p.stockQty > 0;
      if (filter === "out") return p.stockQty <= 0;
      return true;
    });
    const sign = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const left = sortValue(a, sort.key);
      const right = sortValue(b, sort.key);
      if (typeof left === "string" || typeof right === "string") return sign * String(left).localeCompare(String(right), "fr", { sensitivity: "base" });
      return sign * (left - right);
    });
  }, [products, query, filter, sort]);

  const totals = React.useMemo(() => {
    const units = rows.reduce((sum, p) => sum + p.stockQty, 0);
    const value = rows.reduce((sum, p) => sum + p.stockQty * p.purchasePrice, 0);
    const retail = rows.reduce((sum, p) => sum + p.stockQty * p.salePrice, 0);
    const alerts = rows.filter((p) => p.stockQty <= p.minStock).length;
    return { units, value, retail, alerts };
  }, [rows]);

  const toggleSort = (key: SortKey) =>
    setSort((current) => (current.key === key ? { key, dir: current.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "name" ? "asc" : "desc" }));

  if (!products.length) {
    return (
      <div className="rounded-[1.25rem] border border-dashed border-field bg-surface p-8 text-center animate-fade-up">
        <PackageOpen className="mx-auto size-8 text-muted" aria-hidden />
        <p className="mt-3 font-semibold">Aucun produit</p>
        <p className="mt-1 text-sm text-muted">Ajoutez votre premier produit pour commencer à vendre.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Références affichées", value: rows.length, format: (n: number) => `${Math.round(n)}` },
          { label: "Unités en stock", value: totals.units, format: (n: number) => `${Math.round(n)}` },
          { label: "Valeur d'achat", value: totals.value, format: (n: number) => formatXof(n) },
          { label: "Alertes de stock", value: totals.alerts, format: (n: number) => `${Math.round(n)}`, tone: totals.alerts ? "ochre" : "moss" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-line bg-surface px-4 py-3 shadow-[var(--shadow-xs)]">
            <p className="text-xs text-muted">{stat.label}</p>
            <p className={cn("tabular mt-1 text-lg font-semibold", stat.tone === "ochre" && "text-ochre", stat.tone === "moss" && "text-moss")}>
              <AnimatedNumber value={stat.value} format={stat.format} />
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 print:hidden lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border border-line bg-sunken/60 p-1" role="group" aria-label="Filtrer par état de stock">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                aria-pressed={filter === item.key}
                className={cn(
                  "min-h-9 rounded-full px-3.5 text-[13px] font-semibold transition-all duration-200",
                  filter === item.key ? "bg-surface text-ink shadow-[var(--shadow-xs)]" : "text-muted hover:text-ink",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <label htmlFor="product-sort" className="text-sm text-muted">Trier par</label>
          <NativeSelect
            id="product-sort"
            wrapperClassName="w-44"
            value={sort.key}
            onChange={(event) => setSort({ key: event.target.value as SortKey, dir: event.target.value === "name" ? "asc" : "desc" })}
          >
            <option value="name">Nom</option>
            <option value="stockQty">Stock</option>
            <option value="salePrice">Prix de vente</option>
            <option value="margin">Marge</option>
          </NativeSelect>
        </div>
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input type="search" aria-label="Rechercher" placeholder="Rechercher un produit" value={query} onChange={(event) => setQuery(event.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-[1.25rem] border border-line bg-surface shadow-[var(--shadow-xs)]">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-sunken text-xs uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="px-2 py-1 font-semibold">
                <button type="button" onClick={() => toggleSort("name")} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 uppercase hover:text-ink">
                  Produit <SortIcon active={sort.key === "name"} dir={sort.dir} />
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Prix d&apos;achat</th>
              <th scope="col" className="px-2 py-1 text-right font-semibold">
                <button type="button" onClick={() => toggleSort("salePrice")} className="inline-flex min-h-11 items-center justify-end gap-1.5 rounded-lg px-2 uppercase hover:text-ink">
                  Prix de vente <SortIcon active={sort.key === "salePrice"} dir={sort.dir} />
                </button>
              </th>
              <th scope="col" className="px-2 py-1 text-right font-semibold">
                <button type="button" onClick={() => toggleSort("margin")} className="inline-flex min-h-11 items-center justify-end gap-1.5 rounded-lg px-2 uppercase hover:text-ink">
                  Marge <SortIcon active={sort.key === "margin"} dir={sort.dir} />
                </button>
              </th>
              <th scope="col" className="px-2 py-1 text-right font-semibold">
                <button type="button" onClick={() => toggleSort("stockQty")} className="inline-flex min-h-11 items-center justify-end gap-1.5 rounded-lg px-2 uppercase hover:text-ink">
                  Stock <SortIcon active={sort.key === "stockQty"} dir={sort.dir} />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((p, index) => {
              const low = p.stockQty <= p.minStock;
              const out = p.stockQty <= 0;
              const margin = marginOf(p);
              const ratio = p.minStock > 0 ? Math.max(0, Math.min(1, p.stockQty / (p.minStock * 4 || 1))) : 1;
              return (
                <tr
                  key={p.id}
                  className={cn("transition-colors hover:bg-sunken/45 animate-fade-up", low && "bg-ochre-soft/25")}
                  style={{ animationDelay: `${Math.min(index * 22, 400)}ms` }}
                >
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-xl text-xs font-bold",
                          out ? "bg-danger-soft text-danger" : low ? "bg-ochre-soft text-ochre" : "bg-spark-soft text-spark",
                        )}
                      >
                        {p.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{p.name}</span>
                        <span className="mt-0.5 block h-1 w-24 overflow-hidden rounded-full bg-sunken">
                          <span
                            className={cn("block h-full rounded-full transition-[width] duration-700", out ? "bg-danger" : low ? "bg-ochre" : "bg-spark-fill")}
                            style={{ width: `${Math.max(4, ratio * 100)}%` }}
                          />
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="tabular px-4 py-3 text-right">{formatXof(p.purchasePrice)}</td>
                  <td className="tabular px-4 py-3 text-right font-semibold">{formatXof(p.salePrice)}</td>
                  <td className="px-4 py-3 text-right">
                    <Badge tone={margin >= 30 ? "moss" : margin >= 12 ? "spark" : "ochre"} size="sm">
                      {margin} %
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      data-testid="stock-qty"
                      className={cn(
                        "tabular inline-block rounded-full px-2.5 py-1 font-semibold transition-colors",
                        out ? "bg-danger-soft text-danger" : low ? "bg-ochre-soft text-ochre" : "",
                      )}
                    >
                      {p.stockQty}
                    </span>
                    {low ? <span className="sr-only">, stock bas</span> : null}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  Aucun produit ne correspond à cette recherche.
                  {canManage ? " Ajustez le filtre ou ajoutez un produit." : ""}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted print:hidden" aria-live="polite">
        {rows.length} produit(s) affiché(s) sur {products.length}
        {query ? ` · recherche « ${query} »` : ""}
      </p>
    </div>
  );
}
