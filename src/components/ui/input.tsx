import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Apparence commune des champs texte : coins adoucis, bordure nette, halo sarcelle au focus
 * et hauteur tactile de 44 px. Les libellés restent inchangés (contrats d'acceptation).
 */
export const controlClasses = cn(
  "w-full min-w-0 rounded-xl border border-input bg-surface px-3.5 py-2.5 text-[15px] leading-6 text-foreground outline-none",
  "placeholder:text-muted-foreground/70 selection:bg-primary selection:text-primary-foreground transition-[border-color,box-shadow,background-color] duration-200",
  "hover:border-ink/40 focus-visible:border-spark focus-visible:shadow-[0_0_0_3px_var(--spark-soft)]",
  "aria-invalid:border-destructive aria-invalid:shadow-[0_0_0_3px_var(--danger-soft)]",
  "disabled:cursor-not-allowed disabled:bg-sunken disabled:text-muted-foreground motion-reduce:transition-none",
);

/** shadcn/ui Input. */
export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn(controlClasses, "min-h-11 file:border-0 file:bg-transparent file:text-sm file:font-medium", className)} {...props} />;
}
