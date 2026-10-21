import * as React from "react";
import { cn } from "@/lib/utils";

/** Bloc de chargement : même encombrement que le contenu qu'il remplace. */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div aria-hidden className={cn("skeleton", className)} {...props} />;
}

/** Carte KPI en attente de données. */
export function SkeletonKpi({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-[1.25rem] border border-line bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="size-9 rounded-xl" />
          </div>
          <Skeleton className="mt-4 h-7 w-36" />
          <Skeleton className="mt-2 h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

/** Bloc de graphique en attente. */
export function SkeletonChart({ className, bars = 12 }: { className?: string; bars?: number }) {
  return (
    <div className={cn("rounded-[1.25rem] border border-line bg-surface p-5", className)}>
      <Skeleton className="h-4 w-40" />
      <div className="mt-6 flex h-40 items-end gap-2">
        {Array.from({ length: bars }).map((_, i) => (
          <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${28 + ((i * 37) % 68)}%` }} />
        ))}
      </div>
    </div>
  );
}

/** Lignes de tableau en attente. */
export function SkeletonRows({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3.5">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn("h-3.5", c === 0 ? "w-1/3" : "flex-1")} />
          ))}
        </div>
      ))}
    </div>
  );
}
