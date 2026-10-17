import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

/**
 * shadcn/ui Button, restyled for the academy: pill shape and 44 px touch
 * targets. shadcn's variant names (default, outline, destructive, link...)
 * work alongside the brand ones used across the app (primary, spark,
 * inverse, onPanel).
 */
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold outline-none transition-[background-color,color,box-shadow,transform] active:scale-[0.98] focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-brand-strong",
        primary: "bg-primary text-primary-foreground hover:bg-brand-strong",
        outline: "border border-line bg-surface text-ink hover:bg-sunken",
        secondary: "border border-line bg-surface text-ink hover:bg-sunken",
        ghost: "text-ink hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30 dark:text-ink",
        danger: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/30 dark:text-ink",
        link: "rounded-none px-0 text-link underline-offset-4 hover:underline",
        /** Teal call to action. */
        spark: "bg-spark-fill text-on-spark hover:brightness-110",
        /** Solid light button for the navy panels: the strongest call to action there. */
        inverse: "bg-on-panel text-panel hover:bg-white",
        /** Outline button that reads on the navy panel. */
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

/** A Next.js link styled as a shadcn Button. */
export function ButtonLink({ className, variant, size, ...props }: React.ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>) {
  return (
    <Button asChild variant={variant} size={size} className={className}>
      <Link {...props} />
    </Button>
  );
}
