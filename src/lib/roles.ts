import type { User } from "@/generated/prisma/client";

/** Droits par rôle pour ce lot (le cahier des charges prévoit des droits ajustables plus tard). */
export const can = {
  manageUsers: (u: Pick<User, "role">) => u.role === "Admin",
  manageProducts: (u: Pick<User, "role">) => u.role === "Admin" || u.role === "Gérant",
  /** Un caissier ne voit que ses propres ventes. */
  seeAllSales: (u: Pick<User, "role">) => u.role !== "Caissier",
};
