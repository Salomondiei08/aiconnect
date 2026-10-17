import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Libellé + champ + aide ou erreur. Le libellé ne contient que son texte (et « * » si requis) :
 * l'aide est sous le champ, hors du <label>, pour garder un nom accessible exact.
 */
export function FormField({
  id,
  label,
  required,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? " *" : null}
      </Label>
      {children}
      {error ? (
        <p role="alert" id={`${id}-error`} className="text-[13px] font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] leading-relaxed text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/** Bandeau de résultat de formulaire. */
export function FormNotice({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  return (
    <p role={tone === "error" ? "alert" : "status"} className={cn("rounded-xl px-4 py-3 text-sm font-medium leading-relaxed", tone === "error" ? "bg-danger-soft text-danger" : "bg-moss-soft text-moss")}>
      {children}
    </p>
  );
}
