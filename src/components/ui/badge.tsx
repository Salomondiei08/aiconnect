import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Pastilles d'état : rôle, stock, statut d'envoi, compte actif ou suspendu. */
export const badgeVariants = cva(
  "inline-flex min-h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold leading-none transition-colors",
  {
    variants: {
      tone: {
        neutral: "bg-sunken text-muted",
        brand: "bg-brand-soft text-ink",
        spark: "bg-spark-soft text-spark",
        moss: "bg-moss-soft text-moss",
        ochre: "bg-ochre-soft text-ochre",
        danger: "bg-danger-soft text-danger",
        outline: "border border-line text-muted",
        solid: "bg-spark-fill text-on-spark",
      },
      size: {
        sm: "min-h-5 px-2 text-[11px]",
        md: "min-h-6 px-2.5 text-xs",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

export function Badge({ className, tone, size, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ tone, size }), className)} {...props} />;
}

/** Pastille colorée seule (état « en ligne », point de légende). */
export function Dot({ className, tone = "moss", pulse }: { className?: string; tone?: "moss" | "spark" | "ochre" | "danger" | "muted"; pulse?: boolean }) {
  const colors = {
    moss: "bg-moss",
    spark: "bg-spark-fill",
    ochre: "bg-ochre",
    danger: "bg-danger",
    muted: "bg-muted",
  } as const;
  return <span aria-hidden className={cn("inline-block size-2 shrink-0 rounded-full", colors[tone], pulse && "live-dot", className)} />;
}

/** Couleur de pastille cohérente pour les rôles de l'application. */
export function roleTone(role: string): VariantProps<typeof badgeVariants>["tone"] {
  switch (role) {
    case "Admin":
      return "brand";
    case "Gérant":
      return "spark";
    case "Comptable":
      return "moss";
    case "RH":
      return "ochre";
    case "Caissier":
      return "neutral";
    default:
      return "outline";
  }
}
