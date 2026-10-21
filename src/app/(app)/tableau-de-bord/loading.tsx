import { Skeleton, SkeletonChart, SkeletonKpi } from "@/components/ui/skeleton";

/** Pendant le chargement du tableau de bord : mêmes blocs, mêmes hauteurs, sans saut de mise en page. */
export default function DashboardLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Chargement du tableau de bord">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="h-12 w-44 rounded-full" />
      </div>
      <SkeletonKpi rows={5} />
      <SkeletonChart bars={16} />
      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonChart bars={10} />
        <SkeletonChart bars={6} />
      </div>
    </div>
  );
}
