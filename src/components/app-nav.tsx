"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; icon: "dashboard" | "users" | "products" | "sale" };

const ICONS = { dashboard: LayoutDashboard, users: Users, products: Package, sale: ShoppingCart };

/** Liens de navigation de l'application, avec l'entrée active mise en évidence. */
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
                "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition",
                active ? "bg-brand-soft text-ink" : "text-muted hover:bg-sunken hover:text-ink",
              )}
            >
              <Icon className={cn("size-[18px]", active && "text-spark")} aria-hidden />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
