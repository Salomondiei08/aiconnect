import { Skeleton } from "@/components/ui/skeleton";

/** Squelette de l'espace plateforme pendant le chargement des agrégats. */
export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="h-4 w-80 rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5">
            <Skeleton className="h-3 w-28 rounded-md" />
            <Skeleton className="mt-4 h-8 w-36 rounded-lg" />
            <Skeleton className="mt-3 h-3 w-24 rounded-md" />
            <span className="shimmer absolute inset-0" aria-hidden />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-5 lg:col-span-2">
          <Skeleton className="h-4 w-40 rounded-md" />
          <Skeleton className="mt-5 h-52 w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <Skeleton className="h-4 w-32 rounded-md" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full rounded-md" />
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-line bg-surface p-5">
        <Skeleton className="h-4 w-44 rounded-md" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
