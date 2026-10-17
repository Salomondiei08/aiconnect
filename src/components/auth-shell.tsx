import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

/** Cadre des pages publiques de compte : marque, titre, carte centrée. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-16 pt-4 sm:pt-10">
        <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.02em]">{title}</h1>
        {subtitle ? <p className="mt-2 text-muted">{subtitle}</p> : null}
        <div className="mt-6 rounded-[1.25rem] border border-line bg-surface p-5 sm:p-7">{children}</div>
      </main>
    </div>
  );
}
