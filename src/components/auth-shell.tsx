import { BarChart3, CheckCircle2, ShieldCheck, Smartphone } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const HIGHLIGHTS = [
  { icon: Smartphone, text: "La caisse tient dans la main : une vente en trois gestes, même hors bureau." },
  { icon: BarChart3, text: "Ventes, marge et stock bas réunis sur un seul écran, mis à jour à chaque encaissement." },
  { icon: ShieldCheck, text: "Chaque compte ne voit que son entreprise et ce que son rôle autorise." },
];

/**
 * Cadre des pages publiques de compte : panneau de marque animé à gauche, carte de formulaire à droite.
 * Sur écran étroit, le panneau se réduit à un bandeau pour laisser toute la place au formulaire.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  aside,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Contenu optionnel du panneau de marque (aperçu produit, étapes…). */
  aside?: React.ReactNode;
}) {
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="relative isolate hidden overflow-hidden bg-panel text-on-panel lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="aurora" aria-hidden />
        <div className="grid-lines-panel pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative">
          <span className="inline-flex items-center gap-2.5 font-display text-[17px] font-semibold tracking-[-0.01em] text-on-panel">
            <span className="grid size-8 place-items-center rounded-[10px] bg-spark-fill text-on-spark" aria-hidden>
              <svg viewBox="0 0 20 20" className="size-[18px]" fill="currentColor">
                <rect x="2" y="5" width="16" height="3" rx="1.2" />
                <rect x="4.5" y="9.5" width="2.6" height="7" rx="1" />
                <rect x="12.9" y="9.5" width="2.6" height="7" rx="1" />
              </svg>
            </span>
            Comptoir
          </span>
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display text-[clamp(1.6rem,2.6vw,2.2rem)] font-semibold leading-tight tracking-[-0.02em]">
            Votre commerce, tenu au franc près.
          </h2>
          <ul className="mt-7 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm leading-relaxed text-on-panel-muted">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-on-panel/8 text-on-panel">
                  <Icon className="size-4" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
          {aside ? <div className="mt-8">{aside}</div> : null}
        </div>

        <p className="relative flex items-center gap-2 text-xs text-on-panel-muted">
          <CheckCircle2 className="size-4 text-spark-fill" aria-hidden />
          Données isolées par entreprise · mots de passe hachés · liens à usage unique
        </p>
      </div>

      <div className="flex min-h-dvh flex-col">
        <header className="mx-auto flex h-16 w-full max-w-2xl items-center justify-between px-4 sm:px-6 lg:max-w-xl">
          <Logo />
          <ThemeToggle />
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-2 sm:pt-8 lg:max-w-xl">
          <div className="animate-fade-up">
            <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">{title}</h1>
            {subtitle ? <p className="mt-2 text-muted">{subtitle}</p> : null}
            <div className="mt-6 rounded-[1.25rem] border border-line bg-surface p-5 shadow-[var(--shadow-xs)] sm:p-7">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
