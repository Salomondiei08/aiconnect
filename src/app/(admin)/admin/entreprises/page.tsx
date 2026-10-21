import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { loadCompanies } from "@/lib/admin";
import { requirePlatformAdmin } from "@/lib/platform";
import { formatXof } from "@/lib/utils";
import { CompaniesTable } from "./companies-table";

export const metadata: Metadata = { title: "Entreprises", robots: { index: false } };

/** Liste de toutes les entreprises de la plateforme, avec volumes et état. */
export default async function AdminCompaniesPage() {
  await requirePlatformAdmin();
  const companies = await loadCompanies();
  const suspended = companies.filter((c) => c.status === "suspended").length;
  const revenue = companies.reduce((sum, c) => sum + c.revenue, 0);

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">
              <Building2 className="size-6 text-spark" aria-hidden />
              Entreprises
            </h1>
            <p className="mt-1 text-muted">Comptes clients de la plateforme, volumes et état d&apos;accès.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="brand">{companies.length} entreprise(s)</Badge>
            {suspended ? <Badge tone="danger">{suspended} suspendue(s)</Badge> : <Badge tone="moss">Aucune suspension</Badge>}
            <Badge tone="spark">{formatXof(revenue)}</Badge>
          </div>
        </div>
      </Reveal>

      <CompaniesTable companies={companies} />
    </div>
  );
}
