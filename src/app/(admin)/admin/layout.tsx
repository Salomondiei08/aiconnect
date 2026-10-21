import { ArrowLeft, LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AdminSideLink, type AdminIconName } from "@/components/admin-side-link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";
import { db } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/platform";

const SECTIONS: { href: string; label: string; icon: AdminIconName; exact?: boolean }[] = [
  { href: "/admin", label: "Vue d'ensemble", icon: "dashboard", exact: true },
  { href: "/admin/entreprises", label: "Entreprises", icon: "companies" },
  { href: "/admin/utilisateurs", label: "Comptes", icon: "users" },
  { href: "/admin/emails", label: "E-mails", icon: "emails" },
  { href: "/admin/journal", label: "Journal plateforme", icon: "journal" },
];

/**
 * Coquille de l'espace plateforme : réservée aux super-admins (vérifiée à chaque requête).
 * Visuellement distincte de l'application (panneau sombre, badge plateforme) pour qu'on sache
 * toujours dans quel contexte on agit.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requirePlatformAdmin();
  const counts = await Promise.all([db.company.count(), db.user.count()]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-panel px-3 py-4 text-on-panel lg:flex">
        <div className="relative overflow-hidden px-2">
          <span className="pointer-events-none absolute -left-8 -top-14 size-40 rounded-full bg-spark-fill/25 blur-3xl" aria-hidden />
          <span className="relative inline-flex items-center gap-2.5 font-display text-[17px] font-semibold tracking-[-0.01em]">
            <span className="grid size-8 place-items-center rounded-[10px] bg-spark-fill text-on-spark" aria-hidden>
              <ShieldCheck className="size-[18px]" />
            </span>
            Comptoir
          </span>
          <p className="relative mt-2 inline-flex items-center gap-1.5 rounded-full border border-on-panel/20 bg-on-panel/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-on-panel-muted">
            <span className="live-dot size-1.5 rounded-full bg-spark-fill" aria-hidden />
            Espace plateforme
          </p>
        </div>

        <nav aria-label="Navigation plateforme" className="mt-7 flex-1">
          <ul className="space-y-1">
            {SECTIONS.map((section) => (
              <li key={section.href}>
                <AdminSideLink href={section.href} label={section.label} icon={section.icon} exact={section.exact} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3 border-t border-on-panel/15 pt-3 text-sm">
          <p className="px-3 text-xs text-on-panel-muted">
            <span className="tabular font-semibold text-on-panel">{counts[0]}</span> entreprises ·{" "}
            <span className="tabular font-semibold text-on-panel">{counts[1]}</span> comptes
          </p>
          <div className="px-3">
            <p className="truncate font-semibold">{[admin.prefix, admin.firstName, admin.lastName].filter(Boolean).join(" ")}</p>
            <p className="truncate text-xs text-on-panel-muted">{admin.email}</p>
          </div>
          <Link
            href="/tableau-de-bord"
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-on-panel-muted transition-colors hover:bg-on-panel/10 hover:text-on-panel"
          >
            <ArrowLeft className="size-[18px]" aria-hidden />
            Retour à l&apos;application
          </Link>
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start gap-3 rounded-xl px-3 font-medium text-on-panel-muted hover:bg-on-panel/10 hover:text-on-panel"
            >
              <LogOut className="size-[18px]" aria-hidden />
              Se déconnecter
            </Button>
          </form>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="glass-paper sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-line/70 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <span className="lg:hidden">
              <Logo href="/admin" compact />
            </span>
            <p className="flex min-w-0 items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="size-4 shrink-0 text-spark" aria-hidden />
              <span className="truncate">Administration de la plateforme</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button asChild variant="ghost" size="sm" className="hidden text-muted sm:inline-flex">
              <Link href="/tableau-de-bord">
                <ArrowLeft aria-hidden /> Mon application
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <nav aria-label="Navigation plateforme mobile" className="flex gap-2 overflow-x-auto border-b border-line bg-surface px-4 py-2.5 lg:hidden">
          {SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-line px-3.5 text-[13px] font-semibold text-muted transition-colors hover:border-spark/40 hover:text-ink"
            >
              {section.label}
            </Link>
          ))}
        </nav>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
