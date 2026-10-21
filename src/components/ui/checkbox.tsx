"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

/**
 * shadcn/ui Checkbox (Radix). Dans un formulaire il se soumet comme une case native
 * (« on » ou sa valeur) : les actions serveur le lisent sans changement.
 * Coins adoucis et halo sarcelle au focus, cohérents avec les champs texte.
 */
export function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-5 shrink-0 rounded-md border border-input bg-surface outline-none transition-[border-color,box-shadow,background-color,transform] duration-200",
        "hover:border-spark focus-visible:border-spark focus-visible:shadow-[0_0_0_3px_var(--spark-soft)] active:scale-95",
        "disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
        "data-[state=checked]:border-spark-fill data-[state=checked]:bg-spark-fill data-[state=checked]:text-on-spark data-[state=checked]:shadow-[var(--shadow-glow)]",
        "motion-reduce:transition-none motion-reduce:active:scale-100",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="grid place-content-center text-current animate-pop">
        <CheckIcon className="size-3.5" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
