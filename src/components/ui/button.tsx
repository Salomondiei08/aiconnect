import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

/**
 * shadcn/ui Button, restylé pour le plan « Plateau » : pastille, cibles tactiles de 44 px,
 * léger relief au survol et micro-pression au clic. Les noms de variantes shadcn
 * (default, outline, destructive, link…) cohabitent avec ceux de la marque
 * (primary, spark, inverse, onPanel) déjà utilisés dans l'application.
 */
export const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold outline-none transition-[background-color,color,box-shadow,transform,filter] duration-200 active:scale-[0.98] focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-destructive/20 motion-reduce:transition-none motion-reduce:active:scale-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[var(--shadow-sm)] hover:bg-brand-strong hover:shadow-[var(--shadow-md)]",
        primary: "bg-primary text-primary-foreground shadow-[var(--shadow-sm)] hover:bg-brand-strong hover:shadow-[var(--shadow-md)]",
        outline: "border border-line bg-surface text-ink shadow-[var(--shadow-xs)] hover:border-spark/45 hover:bg-sunken",
        secondary: "border border-line bg-surface text-ink shadow-[var(--shadow-xs)] hover:border-spark/45 hover:bg-sunken",
        ghost: "text-ink hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-white shadow-[var(--shadow-sm)] hover:bg-destructive/90 focus-visible:ring-destructive/30 dark:text-ink",
        danger: "bg-destructive text-white shadow-[var(--shadow-sm)] hover:bg-destructive/90 focus-visible:ring-destructive/30 dark:text-ink",
        link: "rounded-none px-0 text-link underline-offset-4 hover:underline",
        /** Appel à l'action sarcelle, avec halo coloré. */
        spark: "bg-spark-fill text-on-spark shadow-[var(--shadow-glow)] hover:brightness-110",
        /** Bouton clair massif pour les panneaux marine : l'appel le plus fort à cet endroit. */
        inverse: "bg-on-panel text-panel shadow-[var(--shadow-md)] hover:bg-white",
        /** Bouton contour qui se lit sur le panneau marine. */
        onPanel: "border border-on-panel/35 text-on-panel hover:bg-on-panel/10",
      },
      size: {
        default: "min-h-11 px-5",
        md: "min-h-11 px-5",
        sm: "min-h-11 px-4 text-[13px] sm:min-h-9",
        lg: "min-h-12 px-7 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant = "default", size = "default", asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" data-variant={variant} data-size={size} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

/** Lien Next.js habillé en Button shadcn. */
export function ButtonLink({ className, variant, size, ...props }: React.ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>) {
  return (
    <Button asChild variant={variant} size={size} className={className}>
      <Link {...props} />
    </Button>
  );
}
