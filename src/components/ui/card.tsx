import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Carte Comptoir : surface nette, coin de 1,25 rem, élévation douce.
 * `interactive` ajoute le soulèvement au survol utilisé par les tuiles et les KPI.
 */
export function Card({ className, interactive, glow, ...props }: React.ComponentProps<"div"> & { interactive?: boolean; glow?: boolean }) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-[1.25rem] border border-line bg-surface shadow-[var(--shadow-xs)]",
        interactive && "card-lift",
        glow && "hover:shadow-[var(--shadow-glow)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex flex-wrap items-start justify-between gap-3 p-5 pb-0", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 data-slot="card-title" className={cn("text-base font-semibold tracking-[-0.01em]", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="card-description" className={cn("mt-1 text-sm text-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("p-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex flex-wrap items-center gap-2 border-t border-line px-5 py-3.5", className)} {...props} />;
}

/** En-tête de section : titre, description et action à droite. */
export function SectionHeading({
  title,
  description,
  action,
  icon: Icon,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 font-display text-[1.15rem] font-semibold tracking-[-0.015em]">
          {Icon ? (
            <span className="grid size-8 place-items-center rounded-xl bg-spark-soft text-spark" aria-hidden>
              <Icon className="size-[17px]" />
            </span>
          ) : null}
          {title}
        </h2>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
