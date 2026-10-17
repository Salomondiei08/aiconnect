import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { can } from "@/lib/roles";
import { UsersTable } from "./users-table";

export const metadata: Metadata = { title: "Utilisateurs" };

export default async function UsersPage() {
  const user = await requireUser();
  if (!can.manageUsers(user)) redirect("/tableau-de-bord");
  const users = await db.user.findMany({ where: { companyId: user.companyId }, orderBy: { username: "asc" } });
  const rows = users.map((u) => ({
    id: u.id,
    username: u.username,
    name: [u.prefix, u.firstName, u.lastName].filter(Boolean).join(" "),
    role: u.role,
    email: u.email,
    isActive: u.isActive,
    isSelf: u.id === user.id,
  }));
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">Utilisateurs</h1>
          <p className="mt-1 text-muted">Gérer les utilisateurs</p>
        </div>
        <ButtonLink href="/utilisateurs/nouveau" className="print:hidden"><Plus aria-hidden /> Ajouter</ButtonLink>
      </div>
      <UsersTable rows={rows} />
    </div>
  );
}
