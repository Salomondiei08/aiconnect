import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Banknote,
  Building2,
  Clock3,
  Layers,
  MailWarning,
  ShieldCheck,
  ShoppingCart,
  Users,
} from "lucide-react";
import { AreaChart } from "@/components/charts/area-chart";
import { BarList } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { AnimatedNumber, AnimatedXof } from "@/components/motion/animated-number";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadPlatformOverview } from "@/lib/admin";
import { PLATFORM_ACTION_LABELS, requirePlatformAdmin } from "@/lib/platform";
import { formatDate, formatDateTime, formatXof } from "@/lib/utils";

export const metadata: Metadata = { title: "Administration de la plateforme", robots: { index: false } };

const EMAIL_LABELS: Record<string, string> = {
  queued: "En attente",
  sent: "Acceptés",
  delivered: "Livrés",
  bounced: "Rejetés",
  failed: "Échoués",
  complained: "Plaintes",
  delayed: "Retardés",
};

const EMAIL_COLORS: Record<string, string> = {
  delivered: "var(--chart-4)",
  sent: "var(--chart-1)",
  queued: "var(--chart-5)",
  bounced: "var(--chart-3)",
  failed: "var(--danger)",
  complained: "var(--danger)",
  delayed: "var(--chart-3)",
};

export default async function AdminOverviewPage() {
  const admin = await requirePlatformAdmin();
  const data = await loadPlatformOverview(30);

  const kpis = [
    { label: "Entreprises", value: data.counts.companies, icon: Building2, note: `${data.counts.suspendedCompanies} suspendue(s)`, href: "/admin/entreprises" },
    { label: "Comptes", value: data.counts.users, icon: Users, note: `${data.counts.activeUsers} actif(s)`, href: "/admin/utilisateurs" },
    { label: "Ventes enregistrées", value: data.counts.sales, icon: ShoppingCart, note: `${data.counts.salesSince} sur 30 jours` },
    { label: "Chiffre d'affaires cumulé", value: data.counts.revenue, icon: Banknote, note: "Toutes entreprises, en XOF", money: true },
    { label: "Références produits", value: data.counts.products, icon: Layers, note: "Catalogues cumulés" },
    { label: "Super-admins", value: data.counts.platformAdmins, icon: ShieldCheck, note: "Comptes avec accès plateforme" },
  ];

  const emailSlices = data.emails.map((row) => ({
    label: EMAIL_LABELS[row.status] ?? row.status,
    value: row.count,
    color: EMAIL_COLORS[row.status] ?? "var(--chart-5)",
  }));
  const emailTotal = emailSlices.reduce((sum, slice) => sum + slice.value, 0);
  const failedEmails = data.emails.filter((row) => row.status === "failed" || row.status === "bounced").reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="space-y-8">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
              <ShieldCheck className="size-3.5 text-spark" aria-hidden />
              Espace plateforme
            </p>
            <h1 className="mt-3 font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">
              Bonjour {admin.firstName}, voici la plateforme
            </h1>
            <p className="mt-1 text-muted">
              Toutes les entreprises, tous les comptes et tous les envois — vos actions y sont journalisées.
            </p>
          </div>
          <Link
            href="/admin/journal"
            className="card-lift inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold shadow-[var(--shadow-xs)]"
          >
            <ScrollTextIcon />
            Journal des actions
          </Link>
        </div>
      </Reveal>

      <section aria-label="Indicateurs plateforme" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi, index) => (
          <Reveal key={kpi.label} delay={index * 50}>
            <Card interactive className="relative h-full overflow-hidden p-5">
              <span aria-hidden className="pointer-events-none absolute -right-10 -top-12 size-28 rounded-full bg-spark-soft/40 blur-2xl" />
              <div className="relative flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-muted">{kpi.label}</p>
                <span className="grid size-9 place-items-center rounded-xl bg-spark-soft text-spark">
                  <kpi.icon className="size-[18px]" aria-hidden />
                </span>
              </div>
              <p className="tabular relative mt-3 text-2xl font-semibold tracking-[-0.01em]">
                {kpi.money ? <AnimatedXof value={kpi.value} /> : <AnimatedNumber value={kpi.value} />}
              </p>
              <p className="relative mt-1 text-xs text-muted">{kpi.note}</p>
              {kpi.href ? (
                <Link href={kpi.href} className="relative mt-3 inline-flex items-center gap-1 text-xs font-semibold text-spark hover:underline">
                  Ouvrir <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              ) : null}
            </Card>
          </Reveal>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Reveal>
          <Card className="h-full">
            <CardHeader>
              <div>
                <CardTitle>Nouvelles entreprises</CardTitle>
                <p className="mt-1 text-sm text-muted">Inscriptions par jour sur 30 jours.</p>
              </div>
              <Badge tone="spark">
                <Activity className="size-3.5" aria-hidden />
                {data.signupSeries.reduce((sum, point) => sum + point.value, 0)} sur la période
              </Badge>
            </CardHeader>
            <CardContent>
              <AreaChart data={data.signupSeries} height={220} valueFormat="count" ariaLabel="Nouvelles entreprises par jour" />
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={70}>
          <Card className="h-full">
            <CardHeader>
              <div>
                <CardTitle>Envois de courriels</CardTitle>
                <p className="mt-1 text-sm text-muted">Statut fournisseur, tous types confondus.</p>
              </div>
              {failedEmails > 0 ? (
                <Badge tone="danger">
                  <MailWarning className="size-3.5" aria-hidden />
                  {failedEmails} en échec
                </Badge>
              ) : null}
            </CardHeader>
            <CardContent>
              {emailTotal ? (
                <DonutChart data={emailSlices} centerLabel="Envois journalisés" valueFormat="count" size={156} />
              ) : (
                <p className="text-sm text-muted">Aucun envoi journalisé pour l&apos;instant.</p>
              )}
            </CardContent>
          </Card>
        </Reveal>
      </div>

      <Reveal>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Chiffre d&apos;affaires par entreprise</CardTitle>
              <p className="mt-1 text-sm text-muted">Les six premières, toutes périodes confondues.</p>
            </div>
            <Link href="/admin/entreprises" className="text-sm font-semibold text-spark hover:underline">
              Toutes les entreprises
            </Link>
          </CardHeader>
          <CardContent>
            {data.revenueByCompany.length ? (
              <BarList data={data.revenueByCompany.map((c) => ({ label: c.name, value: c.revenue, hint: `${c.sales} vente(s)` }))} valueFormat="xof" />
            ) : (
              <p className="text-sm text-muted">Aucune entreprise enregistrée.</p>
            )}
          </CardContent>
        </Card>
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-3">
        <Reveal>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Dernières entreprises</CardTitle>
              <Link href="/admin/entreprises" className="text-sm font-semibold text-spark hover:underline">
                Tout voir
              </Link>
            </CardHeader>
            <CardContent className="pt-3">
              <ul className="divide-y divide-line">
                {data.recentCompanies.map((company) => (
                  <li key={company.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <Link href={`/admin/entreprises/${company.id}`} className="min-w-0 hover:underline">
                      <span className="block truncate font-medium">{company.name}</span>
                      <span className="block truncate text-xs text-muted">
                        {company.city} · {company._count.users} compte(s) · {formatDate(company.createdAt)}
                      </span>
                    </Link>
                    <Badge tone={company.status === "active" ? "moss" : "danger"} size="sm">
                      {company.status === "active" ? "Active" : "Suspendue"}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={70}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Dernières ventes</CardTitle>
              <Badge tone="brand">{formatXof(data.counts.revenue)} cumulés</Badge>
            </CardHeader>
            <CardContent className="pt-3">
              <ul className="divide-y divide-line">
                {data.recentSales.map((sale) => (
                  <li key={sale.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{sale.company.name}</span>
                      <span className="block text-xs text-muted">
                        {formatDateTime(sale.createdAt)} · F-{String(sale.number).padStart(5, "0")}
                      </span>
                    </span>
                    <span className="tabular shrink-0 font-semibold">{formatXof(sale.total)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={140}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock3 className="size-[18px] text-ochre" aria-hidden />
                Actions plateforme
              </CardTitle>
              <Link href="/admin/journal" className="text-sm font-semibold text-spark hover:underline">
                Journal complet
              </Link>
            </CardHeader>
            <CardContent className="pt-3">
              {data.recentActions.length ? (
                <ul className="divide-y divide-line">
                  {data.recentActions.map((entry) => (
                    <li key={entry.id} className="py-3 text-sm">
                      <p className="font-medium">{PLATFORM_ACTION_LABELS[entry.action] ?? entry.action}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {entry.actorEmail} · {formatDateTime(entry.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">
                  Aucune action pour l&apos;instant. Chaque suspension, réactivation ou droit accordé apparaîtra ici.
                </p>
              )}
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}

function ScrollTextIcon() {
  return <span className="grid size-8 place-items-center rounded-full bg-spark-soft text-spark"><Activity className="size-4" aria-hidden /></span>;
}
