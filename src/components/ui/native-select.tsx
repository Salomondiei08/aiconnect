import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { controlClasses } from "./input";

/**
 * shadcn/ui NativeSelect: a real <select> (best on phones, works in plain
 * forms) with the shadcn chevron. Full width by default.
 */
export function NativeSelect({ className, wrapperClassName, ...props }: React.ComponentProps<"select"> & { wrapperClassName?: string }) {
  return (
    <div data-slot="native-select-wrapper" className={cn("group/native-select relative w-full has-[select:disabled]:opacity-60", wrapperClassName)}>
      <select data-slot="native-select" className={cn(controlClasses, "min-h-11 cursor-pointer appearance-none pr-9", className)} {...props} />
      <ChevronDownIcon data-slot="native-select-icon" aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 select-none text-muted-foreground" />
    </div>
  );
}
