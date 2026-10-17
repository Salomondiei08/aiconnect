import * as React from "react";
import { cn } from "@/lib/utils";

/** Shared look of shadcn text controls in the academy: 6 px corners, crisp border, thin focus ring, 44 px tall. */
export const controlClasses = cn(
  "w-full min-w-0 rounded-md border border-input bg-card px-3.5 py-2.5 text-[15px] leading-6 text-foreground outline-none",
  "placeholder:text-muted-foreground/70 selection:bg-primary selection:text-primary-foreground transition-[border-color,box-shadow] duration-150",
  "hover:border-ink/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/15",
  "aria-invalid:border-destructive aria-invalid:ring-destructive/15",
  "disabled:cursor-not-allowed disabled:bg-sunken disabled:text-muted-foreground",
);

/** shadcn/ui Input. */
export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn(controlClasses, "min-h-11 file:border-0 file:bg-transparent file:text-sm file:font-medium", className)} {...props} />;
}
