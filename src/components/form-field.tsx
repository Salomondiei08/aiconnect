import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Libellé + champ + aide ou erreur. Le libellé ne contient que son texte (et « * » si requis) :
 * l'aide est sous le champ, hors du <label>, pour garder un nom accessible exact
 * (les tests d'acceptation repèrent les champs par leur libellé).
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
        <p role="alert" id={`${id}-error`} className="flex items-start gap-1.5 text-[13px] font-medium text-danger animate-fade-up">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
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
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-medium leading-relaxed shadow-[var(--shadow-xs)] animate-fade-up",
        tone === "error" ? "border-danger/25 bg-danger-soft text-danger" : "border-moss/25 bg-moss-soft text-moss",
      )}
    >
      {tone === "error" ? <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />}
      <span>{children}</span>
    </p>
  );
}
