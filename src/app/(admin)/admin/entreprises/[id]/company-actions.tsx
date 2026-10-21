"use client";

import { Ban, CircleCheck } from "lucide-react";
import { useAdminAction } from "@/components/admin/table-kit";
import { Button } from "@/components/ui/button";
import { setCompanyStatusAction } from "@/lib/actions/platform";

/**
 * Suspension / réactivation d'une entreprise depuis sa fiche plateforme.
 * La suspension ferme toutes les sessions de ses comptes : l'effet est immédiat.
 */
export function CompanyActions({ companyId, status }: { companyId: string; status: string; actorIsSelf: boolean }) {
  const { pending, run } = useAdminAction();
  const suspended = status !== "active";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {suspended ? (
        <Button variant="spark" disabled={pending} onClick={() => run(() => setCompanyStatusAction(companyId, "active"))}>
          <CircleCheck aria-hidden /> Réactiver l&apos;entreprise
        </Button>
      ) : (
        <Button variant="danger" disabled={pending} onClick={() => run(() => setCompanyStatusAction(companyId, "suspended"))}>
          <Ban aria-hidden /> Suspendre l&apos;entreprise
        </Button>
      )}
      <p className="text-xs text-muted">
        {suspended ? "Les comptes de cette entreprise pourront se reconnecter." : "Toutes les sessions de ses comptes seront fermées."}
      </p>
    </div>
  );
}
