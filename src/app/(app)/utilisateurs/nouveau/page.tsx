import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { can } from "@/lib/roles";
import { UserForm } from "./user-form";

export const metadata: Metadata = { title: "Ajouter un utilisateur" };

export default async function NewUserPage() {
  const user = await requireUser();
  if (!can.manageUsers(user)) redirect("/tableau-de-bord");
  const locations = await db.location.findMany({ where: { companyId: user.companyId }, select: { id: true, name: true, code: true }, orderBy: { code: "asc" } });
  return (
    <div className="space-y-6">
      <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">Ajouter un utilisateur</h1>
      <UserForm locations={locations} />
    </div>
  );
}
