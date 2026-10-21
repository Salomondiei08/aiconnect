import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Ban, Building2, CircleCheck, Mail, Package, Receipt, Users } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Badge, roleTone } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadCompanyDetail } from "@/lib/admin";
import { invoiceNumber } from "@/lib/invoice-number";
import { PLATFORM_ACTION_LABELS, requirePlatformAdmin } from "@/lib/platform";
import { formatDate, formatDateTime, formatXof } from "@/lib/utils";
import { CompanyActions } from "./company-actions";

export const metadata: Metadata = { title: "Entreprise", robots: { index: false } };

/** Fiche plateforme d'une entreprise : coordonnées, comptes, catalogue, ventes, envois et journal. */
export default async function AdminCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requirePlatformAdmin();
  const { id } = await params;
  const data = await loadCompanyDetail(id);
  if (!data) notFound();

  const { company, users, products, sales, emails, actions } = data;
  const lowStock = products.filter((p) => p.stockQty <= p.minStock).length;

  const facts = [
    { term: "Devise", value: company.currency },
    { term: "Pays", value: company.country },
    { term: "Ville", value: company.city },
    { term: "Commune", value: company.commune },
    { term: "Code postal", value: company.postalCode },
    { term: "Point de repère", value: company.landmark },
    { term: "Fuseau horaire", value: company.timezone },
    { term: "Méthode comptable", value: company.stockMethod },
    { term: "Début d'exercice", value: `Mois ${company.fiscalYearStartMonth}` },
    { term: "Site Internet", value: company.website ?? "—" },
    { term: "Téléphone", value: company.phone ?? "—" },
    { term: "Date de début d'activité", value: company.startDate ? formatDate(company.startDate, company.timezone) : "—" },
  ];

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Link href="/admin/entreprises" className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink">
              <ArrowLeft className="size-4" aria-hidden /> Entreprises
            </Link>
            <h1 className="mt-2 flex flex-wrap items-center gap-3 font-display text-[1.6rem] font-semibold leading-tight tracking-[-0.02em]">
              <Building2 className="size-6 text-spark" aria-hidden />
              {company.name}
              <Badge tone={company.status === "active" ? "moss" : "danger"}>{company.status === "active" ? "Active" : "Suspendue"}</Badge>
            </h1>
            <p className="mt-1 text-sm text-muted">
              Inscrite le {formatDate(company.createdAt)} · identifiant <span className="tabular">{company.id}</span>
            </p>
          </div>
          <CompanyActions companyId={company.id} status={company.status} actorIsSelf={false} />
        </div>
      </Reveal>

      <section aria-label="Volumes" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Chiffre d'affaires", value: formatXof(data.totals._sum.total ?? 0), icon: Receipt, note: `${data.totals._count} vente(s)` },
          { label: "Comptes", value: `${users.length}`, icon: Users, note: `${users.filter((u) => u.isActive).length} actif(s)` },
          { label: "Produits", value: `${products.length}`, icon: Package, note: lowStock ? `${lowStock} en stock bas` : "Stock sain" },
          { label: "Unités en stock", value: `${data.stockUnits}`, icon: Package, note: "Toutes références" },
        ].map((kpi, index) => (
          <Reveal key={kpi.label} delay={index * 55}>
            <Card interactive className="h-full p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-muted">{kpi.label}</p>
                <span className="grid size-9 place-items-center rounded-xl bg-spark-soft text-spark">
                  <kpi.icon className="size-[18px]" aria-hidden />
                </span>
              </div>
              <p className="tabular mt-3 text-xl font-semibold">{kpi.value}</p>
              <p className="mt-1 text-xs text-muted">{kpi.note}</p>
            </Card>
          </Reveal>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Reveal>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Coordonnées et paramètres</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {facts.map((fact) => (
                  <div key={fact.term} className="border-b border-line/70 pb-2">
                    <dt className="text-xs text-muted">{fact.term}</dt>
                    <dd className="mt-0.5 truncate text-sm font-medium" title={fact.value}>
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={70}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-[18px] text-spark" aria-hidden />
                Comptes de l&apos;entreprise
              </CardTitle>
              <Link href="/admin/utilisateurs" className="text-sm font-semibold text-spark hover:underline">
                Tous les comptes
              </Link>
            </CardHeader>
            <CardContent className="pt-3">
              <ul className="divide-y divide-line">
                {users.map((user) => (
                  <li key={user.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {[user.prefix, user.firstName, user.lastName].filter(Boolean).join(" ")}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {user.username} · {user.email}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Badge tone={roleTone(user.role)} size="sm">
                        {user.role}
                      </Badge>
                      <Badge tone={user.isActive ? "moss" : "danger"} size="sm">
                        {user.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </Reveal>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Dernières ventes</CardTitle>
              <Badge tone="brand">{sales.length} affichée(s)</Badge>
            </CardHeader>
            <CardContent className="pt-3">
              {sales.length ? (
                <ul className="divide-y divide-line">
                  {sales.map((sale) => (
                    <li key={sale.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <span className="min-w-0">
                        <span className="block font-medium">{invoiceNumber(sale.number)}</span>
                        <span className="block text-xs text-muted">
                          {formatDateTime(sale.createdAt, company.timezone)} · {[sale.user.firstName, sale.user.lastName].filter(Boolean).join(" ")}
                        </span>
                      </span>
                      <span className="tabular shrink-0 font-semibold">{formatXof(sale.total)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">Aucune vente enregistrée pour cette entreprise.</p>
              )}
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={70}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="size-[18px] text-spark" aria-hidden />
                Derniers envois
              </CardTitle>
              <Link href="/admin/emails" className="text-sm font-semibold text-spark hover:underline">
                Journal complet
              </Link>
            </CardHeader>
            <CardContent className="pt-3">
              {emails.length ? (
                <ul className="divide-y divide-line">
                  {emails.map((email) => (
                    <li key={email.id} className="py-3 text-sm">
                      <p className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate font-medium">{email.subject}</span>
                        <Badge tone={email.status === "delivered" ? "moss" : email.status === "failed" || email.status === "bounced" ? "danger" : "neutral"} size="sm">
                          {email.status}
                        </Badge>
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {email.to} · {formatDateTime(email.createdAt, company.timezone)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">Aucun envoi journalisé.</p>
              )}
            </CardContent>
          </Card>
        </Reveal>
      </div>

      <Reveal>
        <Card>
          <CardHeader>
            <CardTitle>Journal plateforme de cette entreprise</CardTitle>
            <p className="text-sm text-muted">Actions de super-admins la concernant.</p>
          </CardHeader>
          <CardContent className="pt-3">
            {actions.length ? (
              <ul className="divide-y divide-line">
                {actions.map((entry) => (
                  <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <span className="font-medium">{PLATFORM_ACTION_LABELS[entry.action] ?? entry.action}</span>
                    <span className="text-xs text-muted">
                      {entry.actorEmail} · {formatDateTime(entry.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Aucune action plateforme enregistrée pour cette entreprise.</p>
            )}
          </CardContent>
        </Card>
      </Reveal>

      <div className="flex flex-wrap items-center gap-3">
        <ButtonLink href="/admin/entreprises" variant="secondary">
          <ArrowLeft aria-hidden /> Retour à la liste
        </ButtonLink>
        <span className="text-sm text-muted">
          Consulté par {admin.email} — cette fiche traverse l&apos;isolation par entreprise et reste tracée.
        </span>
        <span className="hidden sm:inline-flex gap-2">
          {company.status === "active" ? <Ban className="size-4 text-muted" aria-hidden /> : <CircleCheck className="size-4 text-muted" aria-hidden />}
        </span>
      </div>
    </div>
  );
}
