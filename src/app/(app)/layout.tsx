import { LogOut } from "lucide-react";
import { AppNav, type NavItem } from "@/components/app-nav";
import { Logo } from "@/components/logo";
import { MobileMenu } from "@/components/mobile-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { can } from "@/lib/roles";

function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="ghost" className="w-full justify-start gap-3 rounded-xl px-3 font-medium text-muted">
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
  const items: NavItem[] = [
    { href: "/tableau-de-bord", label: "Tableau de bord", icon: "dashboard" },
    { href: "/ventes/nouvelle", label: "Nouvelle vente", icon: "sale" },
    { href: "/produits", label: "Produits", icon: "products" },
    ...(can.manageUsers(user) ? [{ href: "/utilisateurs", label: "Utilisateurs", icon: "users" } as const] : []),
  ];
  const identity = (
    <div className="px-3 pb-2 text-sm">
      <p className="font-semibold">{[user.prefix, user.firstName, user.lastName].filter(Boolean).join(" ")}</p>
      <p className="text-muted">{user.role}</p>
    </div>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh print:hidden flex-col border-r border-line bg-surface px-3 py-4 lg:flex">
        <Logo href="/tableau-de-bord" className="px-2" />
        <p className="mt-1 flex items-center gap-2 px-3 text-xs font-medium text-muted">
          <span className="size-2 rounded-full bg-moss" aria-hidden />
          <span className="truncate">{company.name}</span>
        </p>
        <nav aria-label="Navigation principale" className="mt-6 flex-1">
          <AppNav items={items} />
        </nav>
        <div className="border-t border-line pt-3">
          {identity}
          <LogoutButton />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 print:hidden items-center justify-between gap-2 border-b border-line/70 bg-paper/85 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <Logo href="/tableau-de-bord" compact />
            <span className="truncate text-sm font-medium text-muted">{company.name}</span>
          </div>
          <p className="hidden text-sm text-muted lg:block">{company.name}</p>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <MobileMenu items={items} footer={<>{identity}<LogoutButton /></>} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
