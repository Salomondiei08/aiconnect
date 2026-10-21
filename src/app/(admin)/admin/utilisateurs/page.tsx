import type { Metadata } from "next";
import { ShieldCheck, Users } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { loadPlatformUsers } from "@/lib/admin";
import { requirePlatformAdmin } from "@/lib/platform";
import { PlatformUsersTable } from "./platform-users-table";

export const metadata: Metadata = { title: "Comptes", robots: { index: false } };

/** Tous les comptes de la plateforme, toutes entreprises confondues. */
export default async function AdminUsersPage() {
  const admin = await requirePlatformAdmin();
  const users = await loadPlatformUsers();
  const admins = users.filter((user) => user.platformRole === "platform_admin").length;
  const inactive = users.filter((user) => !user.isActive).length;

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">
              <Users className="size-6 text-spark" aria-hidden />
              Comptes
            </h1>
            <p className="mt-1 text-muted">
              Tous les utilisateurs de la plateforme : état, rôle, entreprise et sessions ouvertes.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="brand">{users.length} compte(s)</Badge>
            <Badge tone="spark">
              <ShieldCheck className="size-3.5" aria-hidden />
              {admins} super-admin(s)
            </Badge>
            {inactive ? <Badge tone="danger">{inactive} désactivé(s)</Badge> : null}
          </div>
        </div>
      </Reveal>

      <PlatformUsersTable users={users} currentAdminId={admin.id} />
    </div>
  );
}
