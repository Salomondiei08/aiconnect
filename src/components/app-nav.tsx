"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShieldCheck, ShoppingCart, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  icon: "dashboard" | "users" | "products" | "sale" | "admin";
  /** Mention courte à droite du libellé (jamais un chiffre dans le nom accessible du lien). */
  tone?: "brand" | "spark";
};

const ICONS = { dashboard: LayoutDashboard, users: Users, products: Package, sale: ShoppingCart, admin: ShieldCheck };

/**
 * Navigation principale : pastille animée sur l'entrée active, halo au survol.
 * Le nom accessible de chaque lien reste son libellé seul (contrat des tests d'acceptation).
 */
export function AppNav({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200",
                active ? "bg-brand-soft text-ink shadow-[var(--shadow-xs)]" : "text-muted hover:bg-sunken hover:text-ink hover:translate-x-0.5",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-spark-fill transition-all duration-300",
                  active ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0",
                )}
              />
              <Icon className={cn("size-[18px] transition-colors", active ? "text-spark" : "text-muted group-hover:text-spark")} aria-hidden />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
