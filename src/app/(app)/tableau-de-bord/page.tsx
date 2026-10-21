import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Boxes,
  CalendarRange,
  FileWarning,
  PackageOpen,
  Receipt,
  ShoppingCart,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { AreaChart } from "@/components/charts/area-chart";
import { BarList, ColumnChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { AnimatedXof } from "@/components/motion/animated-number";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VerifyBanner } from "@/components/verify-banner";
import { requireUser } from "@/lib/auth/session";
import { loadDashboard, normalizePeriod, PERIODS } from "@/lib/dashboard";
import { invoiceNumber } from "@/lib/invoice-number";
import { can } from "@/lib/roles";
import { cn, formatDate, formatXof } from "@/lib/utils";

export const metadata: Metadata = { title: "Tableau de bord" };

type Kpi = { id: string; label: string; value: number; icon: typeof Banknote; note?: string; tone?: "spark" | "ochre" | "moss" };

function KpiCard({ kpi, index }: { kpi: Kpi; index: number }) {
  const Icon = kpi.icon;
  const tone =
    kpi.tone === "ochre"
      ? "bg-ochre-soft text-ochre"
      : kpi.tone === "moss"
        ? "bg-moss-soft text-moss"
        : "bg-spark-soft text-spark";
  return (
    <Reveal delay={index * 55}>
      <Card interactive className="relative h-full overflow-hidden p-5">
        <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 size-28 rounded-full bg-spark-soft/45 blur-2xl" />
        <div data-testid={kpi.id} className="relative">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-muted">{kpi.label}</p>
            <span className={cn("grid size-9 place-items-center rounded-xl transition-transform duration-300 hover:scale-110", tone)}>
              <Icon className="size-[18px]" aria-hidden />
            </span>
          </div>
          <p className="tabular mt-3 text-2xl font-semibold tracking-[-0.01em]">
            <AnimatedXof value={kpi.value} />
          </p>
          {kpi.note ? <p className="mt-1 text-xs text-muted">{kpi.note}</p> : null}
        </div>
      </Card>
    </Reveal>
  );
}

function PeriodSwitcher({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-line bg-sunken/60 p-1 print:hidden" role="group" aria-label="Période affichée">
      {PERIODS.map((period) => {
        const active = period.days === current;
        return (
          <Link
            key={period.days}
            href={`/tableau-de-bord?periode=${period.days}`}
            aria-current={active ? "true" : undefined}
            className={cn(
              "min-h-9 rounded-full px-3.5 text-[13px] font-semibold transition-all duration-200",
              active ? "bg-surface text-ink shadow-[var(--shadow-xs)]" : "text-muted hover:text-ink",
            )}
          >
            {period.label}
          </Link>
        );
      })}
    </div>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  const user = await requireUser();
  const period = normalizePeriod((await searchParams).periode);
  const data = await loadDashboard(user, period);

  const kpis: Kpi[] = [
    { id: "kpi-total-ventes", label: "Total des ventes", value: data.kpis.totalSales, icon: TrendingUp },
    { id: "kpi-net", label: "Net", value: data.kpis.net, icon: Banknote, note: "Ventes moins le coût d'achat des articles vendus", tone: "moss" },
    { id: "kpi-factures-impayees", label: "Factures impayées", value: data.kpis.unpaidInvoices, icon: FileWarning, tone: "ochre", note: "Ventes à crédit : bientôt" },
    { id: "kpi-total-achats", label: "Total des achats", value: data.kpis.totalPurchases, icon: Receipt, note: "Module achats : bientôt" },
    { id: "kpi-total-depenses", label: "Total des dépenses et frais", value: data.kpis.totalExpenses, icon: Receipt, note: "Module dépenses : bientôt" },
  ];

  const today = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: user.company.timezone }).format(new Date());
  const trendUp = data.trend.trend >= 0;
  const stockSlices = [
    { label: "Valeur d'achat du stock", value: data.stock.purchaseValue, color: "var(--chart-2)" },
    { label: "Marge attendue à la revente", value: Math.max(0, data.stock.retailValue - data.stock.purchaseValue), color: "var(--chart-1)" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <Reveal>
          <div>
            <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">Bienvenue, {user.firstName}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted">
              <span className="capitalize">{today}</span>
              <span aria-hidden className="text-line">•</span>
              <span>Voici l&apos;état de votre commerce.</span>
            </p>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <ButtonLink href="/ventes/nouvelle" variant="spark" size="lg" className="sweep shadow-[var(--shadow-glow)]">
            <ShoppingCart aria-hidden />
            Nouvelle vente
          </ButtonLink>
        </Reveal>
      </div>

      {user.emailVerifiedAt ? null : <VerifyBanner email={user.email} />}

      {data.saleCount === 0 ? (
        <Card className="border-dashed p-6 text-center animate-fade-up">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-spark-soft text-spark" aria-hidden>
            <ShoppingCart className="size-6" />
          </span>
          <p className="mt-3 font-semibold">Aucune vente pour l&apos;instant</p>
          <p className="mt-1 text-sm text-muted">Ajoutez vos produits puis enregistrez votre première vente : les chiffres s&apos;afficheront ici.</p>
        </Card>
      ) : null}

      <section aria-label="Indicateurs" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi, index) => (
          <KpiCard key={kpi.id} kpi={kpi} index={index} />
        ))}
      </section>

      <Reveal>
        <Card className="overflow-hidden">
          <CardHeader className="gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarRange className="size-[18px] text-spark" aria-hidden />
                Évolution des ventes
              </CardTitle>
              <p className="mt-1 text-sm text-muted">
                Chiffre d&apos;affaires sur {period} jours, dans le fuseau {user.company.timezone}.
              </p>
            </div>
            <PeriodSwitcher current={period} />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-sunken/60 px-4 py-3">
                <p className="text-xs text-muted">Période</p>
                <p className="tabular mt-0.5 text-lg font-semibold">{formatXof(data.trend.periodRevenue)}</p>
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold">
                  {trendUp ? <ArrowUpRight className="size-3.5 text-moss" aria-hidden /> : <ArrowDownRight className="size-3.5 text-danger" aria-hidden />}
                  <span className={trendUp ? "text-moss" : "text-danger"}>
                    {trendUp ? "+" : ""}
                    {data.trend.trend} %
                  </span>
                  <span className="font-normal text-muted">vs première moitié</span>
                </p>
              </div>
              <div className="rounded-xl bg-sunken/60 px-4 py-3">
                <p className="text-xs text-muted">Panier moyen</p>
                <p className="tabular mt-0.5 text-lg font-semibold">{formatXof(data.trend.averageBasket)}</p>
                <p className="mt-1 text-xs text-muted">{data.trend.periodCount} vente(s) encaissée(s)</p>
              </div>
              <div className="rounded-xl bg-sunken/60 px-4 py-3">
                <p className="text-xs text-muted">Meilleure journée</p>
                <p className="tabular mt-0.5 text-lg font-semibold">{formatXof(data.trend.bestDay?.revenue ?? 0)}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                  <Trophy className="size-3.5 text-ochre" aria-hidden />
                  {data.trend.bestDay?.label ?? "—"}
                </p>
              </div>
            </div>
            <AreaChart
              data={data.series.map((point) => ({ label: point.label, value: point.revenue }))}
              height={240}
              valueFormat="xofShort"
              ariaLabel={`Chiffre d'affaires des ${period} derniers jours`}
            />
          </CardContent>
        </Card>
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal>
          <Card className="h-full">
            <CardHeader>
              <div>
                <CardTitle>Ventes par jour</CardTitle>
                <p className="mt-1 text-sm text-muted">Nombre de passages en caisse.</p>
              </div>
              <Badge tone="spark">{data.trend.periodCount} ventes</Badge>
            </CardHeader>
            <CardContent>
              <ColumnChart
                data={data.series.map((point) => ({ label: point.label, value: point.count }))}
                height={200}
                valueFormat="count"
                ariaLabel="Nombre de ventes par jour"
              />
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={70}>
          <Card className="h-full">
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="size-[18px] text-ochre" aria-hidden />
                  Meilleures ventes
                </CardTitle>
                <p className="mt-1 text-sm text-muted">Produits les plus vendus, en chiffre d&apos;affaires.</p>
              </div>
            </CardHeader>
            <CardContent>
              {data.topProducts.length ? (
                <BarList
                  data={data.topProducts.map((p) => ({ label: p.name, value: p.revenue, hint: `${p.qty} unité(s) vendue(s)` }))}
                  valueFormat="xof"
                />
              ) : (
                <p className="text-sm text-muted">Les produits les plus vendus apparaîtront ici après vos premières ventes.</p>
              )}
            </CardContent>
          </Card>
        </Reveal>
      </div>

      <Reveal>
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Boxes className="size-[18px] text-spark" aria-hidden />
                État du stock
              </CardTitle>
              <p className="mt-1 text-sm text-muted">Valeur immobilisée et marge attendue à la revente.</p>
            </div>
            {data.stock.alerts > 0 ? (
              <Badge tone="ochre">
                <AlertTriangle className="size-3.5" aria-hidden />
                {data.stock.alerts} alerte(s)
              </Badge>
            ) : (
              <Badge tone="moss">Stock sain</Badge>
            )}
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <DonutChart data={stockSlices} centerLabel="Valeur du stock" valueFormat="xofShort" />
            <dl className="grid grid-cols-2 gap-3">
              {[
                { term: "Références", value: `${data.stock.references}` },
                { term: "Unités en stock", value: `${data.stock.units}` },
                { term: "Valeur d'achat", value: formatXof(data.stock.purchaseValue) },
                { term: "Valeur de revente", value: formatXof(data.stock.retailValue) },
              ].map((item) => (
                <div key={item.term} className="rounded-xl border border-line bg-paper/60 px-4 py-3">
                  <dt className="text-xs text-muted">{item.term}</dt>
                  <dd className="tabular mt-1 text-base font-semibold">{item.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Dernières ventes</CardTitle>
              <ButtonLink href="/ventes/nouvelle" variant="ghost" size="sm" className="-mr-2 text-spark">
                <ShoppingCart aria-hidden /> Nouvelle vente
              </ButtonLink>
            </CardHeader>
            <CardContent className="pt-3">
              {data.recent.length ? (
                <ul className="divide-y divide-line">
                  {data.recent.map((s) => (
                    <li key={s.id} className="group flex items-center justify-between gap-3 py-3 text-sm transition-colors">
                      <span className="min-w-0">
                        <span className="font-semibold transition-colors group-hover:text-spark">{invoiceNumber(s.number)}</span>
                        <span className="ml-2 text-muted">
                          {formatDate(s.createdAt, user.company.timezone)} · {s.items.reduce((sum, i) => sum + i.qty, 0)} article(s)
                        </span>
                      </span>
                      <span className="tabular shrink-0 font-semibold">{formatXof(s.total)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">Les ventes apparaîtront ici.</p>
              )}
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={70}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-ochre" aria-hidden /> Stock bas
              </CardTitle>
              <ButtonLink href="/produits" variant="ghost" size="sm" className="-mr-2 text-spark">
                Voir le catalogue
              </ButtonLink>
            </CardHeader>
            <CardContent className="pt-3">
              {data.lowStock.length ? (
                <ul className="divide-y divide-line">
                  {data.lowStock.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <span className="min-w-0 truncate font-medium">{p.name}</span>
                      <span className="tabular shrink-0 rounded-full bg-ochre-soft px-2.5 py-1 text-xs font-semibold text-ochre">
                        {p.stockQty} restant(s)
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="flex items-center gap-2 text-sm text-muted">
                  <PackageOpen className="size-4" aria-hidden /> Aucun produit sous son seuil d&apos;alerte.
                </p>
              )}
            </CardContent>
          </Card>
        </Reveal>
      </div>

      <Reveal>
        <section aria-label="Raccourcis" className="grid gap-3 sm:grid-cols-3">
          {[
            { href: "/ventes/nouvelle", label: "Encaisser une vente", text: "Caisse rapide, reçu PDF et envoi par e-mail.", icon: ShoppingCart },
            ...(can.manageProducts(user)
              ? [{ href: "/produits?ajouter=1", label: "Ajouter un produit", text: "Prix d'achat, prix de vente et seuil d'alerte.", icon: Boxes }]
              : []),
            ...(can.manageUsers(user)
              ? [{ href: "/utilisateurs", label: "Gérer l'équipe", text: "Rôles, accès et journal d'activité.", icon: Users }]
              : []),
          ].map((shortcut, index) => (
            <Link
              key={shortcut.href}
              href={shortcut.href}
              className="card-lift group flex items-start gap-3 rounded-[1.25rem] border border-line bg-surface p-4 shadow-[var(--shadow-xs)]"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-spark-soft text-spark transition-transform duration-300 group-hover:scale-110" aria-hidden>
                <shortcut.icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{shortcut.label}</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-muted">{shortcut.text}</span>
              </span>
            </Link>
          ))}
        </section>
      </Reveal>
    </div>
  );
}
