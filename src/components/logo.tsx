import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Marque Comptoir : un comptoir stylisé (plateau + pied) dans une pastille sarcelle.
 * Le halo et le léger relief au survol font partie du langage « Plateau » sans toucher au texte.
 */
export function Logo({ href = "/", className, compact }: { href?: string; className?: string; compact?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex min-h-11 items-center gap-2.5 rounded-full pr-2 font-display text-[17px] font-semibold tracking-[-0.01em] text-ink transition-colors",
        className,
      )}
    >
      <span className="relative grid size-8 place-items-center rounded-[10px] bg-spark-fill text-on-spark shadow-[var(--shadow-glow)] transition-transform duration-300 group-hover:-translate-y-0.5 group-active:translate-y-0 motion-reduce:transition-none">
        <span className="pointer-events-none absolute inset-0 rounded-[10px] bg-gradient-to-b from-white/25 to-transparent" aria-hidden />
        <svg viewBox="0 0 20 20" className="relative size-[18px]" fill="currentColor" aria-hidden>
          <rect x="2" y="5" width="16" height="3" rx="1.2" />
          <rect x="4.5" y="9.5" width="2.6" height="7" rx="1" />
          <rect x="12.9" y="9.5" width="2.6" height="7" rx="1" />
        </svg>
      </span>
      <span className={compact ? "sr-only sm:not-sr-only" : undefined}>Comptoir</span>
    </Link>
  );
}
