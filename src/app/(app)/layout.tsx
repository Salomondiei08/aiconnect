import { AlertTriangle, LogOut } from "lucide-react";
import Link from "next/link";
import { AppNav, type NavItem } from "@/components/app-nav";
import { AppSearch, type CommandItem } from "@/components/command-palette";
import { Logo } from "@/components/logo";
import { MobileMenu } from "@/components/mobile-menu";
import { RouteProgress } from "@/components/route-progress";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { isPlatformAdmin } from "@/lib/platform";
import { can } from "@/lib/roles";

function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="ghost" className="w-full justify-start gap-3 rounded-xl px-3 font-medium text-muted transition-colors hover:text-danger">
        <LogOut className="size-[18px]" aria-hidden />
        Se déconnecter
      </Button>
    </form>
  );
}

/** Coquille des pages connectées : toute page sous ce groupe exige une session valide. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const company = await db.company.findUniqueOrThrow({ where: { id: user.companyId }, select: { name: true } });
  const platformAdmin = isPlatformAdmin(user);
  const lowStock = await db.product.count({ where: { companyId: user.companyId, stockQty: { lte: db.product.fields.minStock } } });

  const items: NavItem[] = [
    { href: "/tableau-de-bord", label: "Tableau de bord", icon: "dashboard" },
    { href: "/ventes/nouvelle", label: "Nouvelle vente", icon: "sale" },
    { href: "/produits", label: "Produits", icon: "products" },
    ...(can.manageUsers(user) ? [{ href: "/utilisateurs", label: "Utilisateurs", icon: "users" } as const] : []),
    ...(platformAdmin ? [{ href: "/admin", label: "Administration", icon: "admin" } as const] : []),
  ];

  const commands: CommandItem[] = [
    ...items.map((item) => ({
      id: item.href,
      label: item.label,
      group: "Navigation",
      href: item.href,
      icon: item.icon === "admin" ? ("admin" as const) : item.icon === "sale" ? ("sale" as const) : item.icon === "products" ? ("products" as const) : item.icon === "users" ? ("users" as const) : ("dashboard" as const),
    })),
    ...(can.manageProducts(user)
      ? [{ id: "nouveau-produit", label: "Ajouter un produit", hint: "produits", group: "Actions", href: "/produits?ajouter=1", icon: "plus" as const }]
      : []),
    { id: "toggle-theme", label: "Changer le thème (clair ou sombre)", group: "Actions", icon: "theme" as const },
  ];

  const initials = [user.firstName, user.lastName]
    .filter((part): part is string => Boolean(part))
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  const identity = (
    <div className="px-3 pb-2 text-sm">
      <p className="flex items-center gap-2 font-semibold">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand-soft text-[11px] font-bold text-ink" aria-hidden>
          {initials || "•"}
        </span>
        <span className="min-w-0 truncate">{[user.prefix, user.firstName, user.lastName].filter(Boolean).join(" ")}</span>
      </p>
      <p className="mt-1 truncate text-muted">{user.role}</p>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16.5rem_1fr]">
      <RouteProgress />
      <aside className="sticky top-0 hidden h-dvh print:hidden flex-col border-r border-line bg-surface px-3 py-4 lg:flex">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-hidden rounded-b-[2rem] opacity-[0.07]" aria-hidden>
          <div className="aurora" />
        </div>
        <Logo href="/tableau-de-bord" className="relative px-2" />
        <p className="relative mt-1 flex items-center gap-2 px-3 text-xs font-medium text-muted">
          <span className="live-dot size-2 rounded-full bg-moss" aria-hidden />
          <span className="truncate">{company.name}</span>
        </p>
        <nav aria-label="Navigation principale" className="relative mt-6 flex-1">
          <AppNav items={items} />
        </nav>

        {lowStock > 0 ? (
          <Link
            href="/produits"
            className="relative mb-3 flex items-start gap-2.5 rounded-xl bg-ochre-soft px-3 py-2.5 text-xs font-medium text-ochre transition-transform hover:-translate-y-0.5"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              Stock bas sur {lowStock} produit{lowStock > 1 ? "s" : ""}
              <span className="mt-0.5 block font-normal opacity-80">Voir le catalogue</span>
            </span>
          </Link>
        ) : null}

        <div className="relative border-t border-line pt-3">
          {identity}
          <LogoutButton />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="glass-paper sticky top-0 z-30 flex h-16 print:hidden items-center justify-between gap-2 border-b border-line/70 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <Logo href="/tableau-de-bord" compact />
            <span className="truncate text-sm font-medium text-muted">{company.name}</span>
          </div>
          <p className="hidden text-sm text-muted lg:block">{company.name}</p>
          <div className="flex items-center gap-1.5">
            <AppSearch items={commands} />
            <ThemeToggle />
            <MobileMenu items={items} footer={<>{identity}<LogoutButton /></>} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
