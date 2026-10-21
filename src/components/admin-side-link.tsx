"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, Mail, ScrollText, Users } from "lucide-react";
import { cn } from "@/lib/utils";

/** Les icônes restent côté client : le serveur n'envoie que leur nom. */
const ICONS = { dashboard: LayoutDashboard, companies: Building2, users: Users, emails: Mail, journal: ScrollText };

export type AdminIconName = keyof typeof ICONS;

/** Lien de la barre latérale plateforme, avec pastille sarcelle sur la section active. */
export function AdminSideLink({ href, label, icon, exact }: { href: string; label: string; icon: AdminIconName; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const Icon = ICONS[icon];
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200",
        active ? "bg-on-panel/12 text-on-panel" : "text-on-panel-muted hover:bg-on-panel/8 hover:text-on-panel hover:translate-x-0.5",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-spark-fill transition-all duration-300",
          active ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0",
        )}
      />
      <Icon className={cn("size-[18px] transition-colors", active ? "text-spark-fill" : "opacity-80")} aria-hidden />
      {label}
    </Link>
  );
}
