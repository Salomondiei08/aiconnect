import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

/**
 * Lectures de l'espace plateforme (/admin) : ici, et seulement ici, les requêtes traversent
 * toutes les entreprises. Chaque fonction commence par `requirePlatformAdmin()` côté page ou action.
 */

export type PlatformOverview = Awaited<ReturnType<typeof loadPlatformOverview>>;

/** Indicateurs globaux, séries d'inscriptions et de chiffre d'affaires, activité récente. */
export async function loadPlatformOverview(days = 30) {
  const since = startOfDay(days);

  // Requêtes menées une à une : la vue d'ensemble n'est pas sur un chemin critique et cela évite
  // d'ouvrir trop de connexions simultanées (la base de démonstration locale n'en accepte qu'une).
  const companies = await db.company.count();
  const suspendedCompanies = await db.company.count({ where: { status: "suspended" } });
  const users = await db.user.count();
  const activeUsers = await db.user.count({ where: { isActive: true } });
  const platformAdmins = await db.user.count({ where: { platformRole: "platform_admin" } });
  const products = await db.product.count();
  const sales = await db.sale.aggregate({ _sum: { total: true }, _count: true });
  const salesSince = await db.sale.count({ where: { createdAt: { gte: since } } });
  const revenueByCompany = await db.$queryRaw<{ companyId: string; name: string; revenue: number; sales: number }[]>(
    Prisma.sql`
      SELECT "Company".id AS "companyId", "Company".name AS name,
             COALESCE(SUM("Sale".total), 0)::int AS revenue,
             COUNT("Sale".id)::int AS sales
      FROM "Company"
      LEFT JOIN "Sale" ON "Sale"."companyId" = "Company".id
      GROUP BY "Company".id, "Company".name
      ORDER BY revenue DESC
      LIMIT 6`,
  );
  const signups = await db.$queryRaw<{ day: Date; signups: number }[]>(
    Prisma.sql`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS signups
      FROM "Company"
      WHERE "createdAt" >= ${since}
      GROUP BY 1
      ORDER BY 1`,
  );
  const emailStatuses = await db.emailDelivery.groupBy({ by: ["status"], _count: { _all: true } });
  const recentCompanies = await db.company.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, name: true, city: true, country: true, status: true, createdAt: true, _count: { select: { users: true, products: true } } },
  });
  const recentSales = await db.sale.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { id: true, number: true, total: true, createdAt: true, company: { select: { name: true } } },
  });
  const recentActions = await db.platformAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 });

  const byDay = new Map(signups.map((row) => [dayKey(row.day), Number(row.signups)]));
  const signupSeries = Array.from({ length: days }, (_, index) => {
    const date = new Date(since.getTime() + index * 86_400_000);
    return { label: shortLabel(date, days), value: byDay.get(dayKey(date)) ?? 0 };
  });

  return {
    counts: {
      companies,
      suspendedCompanies,
      users,
      activeUsers,
      platformAdmins,
      products,
      sales: sales._count,
      salesSince,
      revenue: sales._sum.total ?? 0,
    },
    revenueByCompany: revenueByCompany.map((row) => ({ id: row.companyId, name: row.name, revenue: Number(row.revenue), sales: Number(row.sales) })),
    signupSeries,
    emails: emailStatuses.map((row) => ({ status: row.status, count: row._count._all })),
    recentCompanies,
    recentSales,
    recentActions,
  };
}

export type AdminCompanyRow = {
  id: string;
  name: string;
  city: string;
  country: string;
  status: string;
  currency: string;
  createdAt: Date;
  users: number;
  activeUsers: number;
  products: number;
  sales: number;
  revenue: number;
};

/** Toutes les entreprises avec leurs volumes, pour le tableau de l'espace plateforme. */
export async function loadCompanies(): Promise<AdminCompanyRow[]> {
  const [companies, aggregates] = await Promise.all([
    db.company.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        city: true,
        country: true,
        status: true,
        currency: true,
        createdAt: true,
        _count: { select: { users: true, products: true, sales: true } },
        users: { where: { isActive: true }, select: { id: true } },
      },
    }),
    db.$queryRaw<{ companyId: string; revenue: number }[]>(
      Prisma.sql`SELECT "companyId", COALESCE(SUM(total), 0)::int AS revenue FROM "Sale" GROUP BY "companyId"`,
    ),
  ]);
  const revenueOf = new Map(aggregates.map((row) => [row.companyId, Number(row.revenue)]));
  return companies.map((company) => ({
    id: company.id,
    name: company.name,
    city: company.city,
    country: company.country,
    status: company.status,
    currency: company.currency,
    createdAt: company.createdAt,
    users: company._count.users,
    activeUsers: company.users.length,
    products: company._count.products,
    sales: company._count.sales,
    revenue: revenueOf.get(company.id) ?? 0,
  }));
}

/** Fiche plateforme d'une entreprise : coordonnées, comptes, produits, ventes et envois. */
export async function loadCompanyDetail(companyId: string) {
  const [company, users, products, sales, emails, actions] = await Promise.all([
    db.company.findUnique({ where: { id: companyId } }),
    db.user.findMany({ where: { companyId }, orderBy: { createdAt: "asc" } }),
    db.product.findMany({ where: { companyId }, orderBy: { name: "asc" }, take: 50 }),
    db.sale.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, number: true, total: true, createdAt: true, paymentMethod: true, user: { select: { firstName: true, lastName: true } } },
    }),
    db.emailDelivery.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 10 }),
    db.platformAuditLog.findMany({ where: { companyId }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);
  if (!company) return null;
  const totals = await db.sale.aggregate({ where: { companyId }, _sum: { total: true }, _count: true });
  const stock = await db.product.aggregate({ where: { companyId }, _sum: { stockQty: true } });
  return { company, users, products, sales, emails, actions, totals, stockUnits: totals._count ? (stock._sum.stockQty ?? 0) : 0 };
}

export type AdminUserRow = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  canLogin: boolean;
  platformRole: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  companyId: string;
  company: string;
  companyStatus: string;
  sessions: number;
};

/** Tous les comptes de la plateforme, avec leur entreprise et leurs sessions ouvertes. */
export async function loadPlatformUsers(): Promise<AdminUserRow[]> {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      prefix: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      isActive: true,
      canLogin: true,
      platformRole: true,
      lastLoginAt: true,
      createdAt: true,
      companyId: true,
      company: { select: { name: true, status: true } },
      _count: { select: { sessions: true } },
    },
  });
  return users.map((u) => ({
    id: u.id,
    username: u.username,
    name: [u.prefix, u.firstName, u.lastName].filter(Boolean).join(" "),
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    canLogin: u.canLogin,
    platformRole: u.platformRole,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    companyId: u.companyId,
    company: u.company.name,
    companyStatus: u.company.status,
    sessions: u._count.sessions,
  }));
}

export type AdminEmailRow = {
  id: string;
  type: string;
  to: string;
  subject: string;
  status: string;
  attempts: number;
  error: string | null;
  companyId: string | null;
  company: string | null;
  createdAt: Date;
  lastEventAt: Date | null;
};

/** Journal des envois, toutes entreprises confondues (aucun contenu ni secret : métadonnées seulement). */
export async function loadEmails(limit = 200): Promise<AdminEmailRow[]> {
  const emails = await db.emailDelivery.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      to: true,
      subject: true,
      status: true,
      attempts: true,
      error: true,
      companyId: true,
      createdAt: true,
      lastEventAt: true,
      company: { select: { name: true } },
    },
  });
  return emails.map((email) => ({ ...email, company: email.company?.name ?? null }));
}

/** Journal des actions de super-admins. */
export async function loadPlatformActions(limit = 100) {
  return db.platformAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}

function startOfDay(days: number): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - (days - 1));
  return date;
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shortLabel(date: Date, days: number): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC", day: "numeric", ...(days > 10 ? { month: "short" } : {}) }).format(date);
}
