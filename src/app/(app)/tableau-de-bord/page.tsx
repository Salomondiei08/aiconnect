import type { Metadata } from "next";
import { AlertTriangle, Banknote, FileWarning, PackageOpen, Receipt, ShoppingCart, TrendingUp } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { loadDashboard } from "@/lib/dashboard";
import { invoiceNumber } from "@/lib/invoice-number";
import { formatDate, formatXof } from "@/lib/utils";

export const metadata: Metadata = { title: "Tableau de bord" };

type Kpi = { id: string; label: string; value: number; icon: typeof Banknote; note?: string; tone?: "spark" | "ochre" };

function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.icon;
  return (
    <div data-testid={kpi.id} className="rounded-[1.25rem] border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted">{kpi.label}</p>
        <span className={`grid size-9 place-items-center rounded-xl ${kpi.tone === "ochre" ? "bg-ochre-soft text-ochre" : "bg-spark-soft text-spark"}`}>
          <Icon className="size-[18px]" aria-hidden />
        </span>
      </div>
      <p className="tabular mt-3 text-2xl font-semibold tracking-[-0.01em]">{formatXof(kpi.value)}</p>
      {kpi.note ? <p className="mt-1 text-xs text-muted">{kpi.note}</p> : null}
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await loadDashboard(user);
  const kpis: Kpi[] = [
    { id: "kpi-total-ventes", label: "Total des ventes", value: data.kpis.totalSales, icon: TrendingUp },
    { id: "kpi-net", label: "Net", value: data.kpis.net, icon: Banknote, note: "Ventes moins le coût d'achat des articles vendus" },
    { id: "kpi-factures-impayees", label: "Factures impayées", value: data.kpis.unpaidInvoices, icon: FileWarning, tone: "ochre", note: "Ventes à crédit : bientôt" },
    { id: "kpi-total-achats", label: "Total des achats", value: data.kpis.totalPurchases, icon: Receipt, note: "Module achats : bientôt" },
    { id: "kpi-total-depenses", label: "Total des dépenses et frais", value: data.kpis.totalExpenses, icon: Receipt, note: "Module dépenses : bientôt" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">Bienvenue, {user.firstName}</h1>
          <p className="mt-1 text-muted">Voici l&apos;état de votre commerce.</p>
        </div>
        <ButtonLink href="/ventes/nouvelle" variant="spark" size="lg">
          <ShoppingCart aria-hidden />
          Nouvelle vente
        </ButtonLink>
      </div>

      {data.saleCount === 0 ? (
        <div className="rounded-[1.25rem] border border-dashed border-field bg-surface p-6 text-center">
          <p className="font-semibold">Aucune vente pour l&apos;instant</p>
          <p className="mt-1 text-sm text-muted">Ajoutez vos produits puis enregistrez votre première vente : les chiffres s&apos;afficheront ici.</p>
        </div>
      ) : null}

      <section aria-label="Indicateurs" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => <KpiCard key={kpi.id} kpi={kpi} />)}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[1.25rem] border border-line bg-surface p-5">
          <h2 className="font-semibold">Dernières ventes</h2>
          {data.recent.length ? (
            <ul className="mt-3 divide-y divide-line">
              {data.recent.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span>{invoiceNumber(s.number)} <span className="text-muted">· {formatDate(s.createdAt)}</span></span>
                  <span className="tabular font-semibold">{formatXof(s.total)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">Les ventes apparaîtront ici.</p>
          )}
        </section>
        <section className="rounded-[1.25rem] border border-line bg-surface p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4 text-ochre" aria-hidden /> Stock bas
          </h2>
          {data.lowStock.length ? (
            <ul className="mt-3 divide-y divide-line">
              {data.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span>{p.name}</span>
                  <span className="tabular rounded-full bg-ochre-soft px-2.5 py-1 text-xs font-semibold text-ochre">{p.stockQty} restant(s)</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted"><PackageOpen className="size-4" aria-hidden /> Aucun produit sous son seuil d&apos;alerte.</p>
          )}
        </section>
      </div>
    </div>
  );
}
