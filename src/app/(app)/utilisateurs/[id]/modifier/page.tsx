import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { can } from "@/lib/roles";
import { UserForm } from "../../nouveau/user-form";

export const metadata: Metadata = { title: "Modifier l'utilisateur" };

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireUser();
  if (!can.manageUsers(admin)) redirect("/tableau-de-bord");
  const { id } = await params;
  const [user, locations] = await Promise.all([
    db.user.findFirst({ where: { id, companyId: admin.companyId }, include: { locations: true } }),
    db.location.findMany({ where: { companyId: admin.companyId }, select: { id: true, name: true, code: true }, orderBy: { code: "asc" } }),
  ]);
  if (!user) notFound();
  return (
    <div className="space-y-6">
      <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">Modifier l&apos;utilisateur</h1>
      <UserForm
        locations={locations}
        user={{
          id: user.id,
          prefix: user.prefix ?? "",
          firstName: user.firstName,
          lastName: user.lastName ?? "",
          email: user.email,
          username: user.username,
          role: user.role,
          isActive: user.isActive,
          canLogin: user.canLogin,
          allLocations: user.allLocations,
          locationIds: user.locations.map((l) => l.locationId),
        }}
      />
    </div>
  );
}
