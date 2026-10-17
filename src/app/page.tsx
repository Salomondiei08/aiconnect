import { ArrowRight, BarChart3, Boxes, Mail, ReceiptText, ShieldCheck, Smartphone } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ButtonLink } from "@/components/ui/button";

const features = [
  { icon: ReceiptText, title: "Caisse rapide", text: "Une vente en trois gestes, un reçu PDF prêt à imprimer ou à envoyer par e-mail." },
  { icon: Boxes, title: "Stock à jour", text: "Chaque vente retire les quantités. Les produits sous le seuil d'alerte sont signalés." },
  { icon: BarChart3, title: "Chiffres du jour", text: "Ventes, marge et stock bas sur un seul écran, boutique par boutique." },
  { icon: ShieldCheck, title: "Équipe et rôles", text: "Caissiers, gérants, comptable : chacun ne voit que ce qui le concerne." },
];

/** Aperçu statique du tableau de bord, pour montrer le produit plutôt que le décrire. */
function DashboardPreview() {
  const cards = [
    { label: "Total des ventes", value: "184 500 FCFA" },
    { label: "Marge", value: "52 300 FCFA" },
    { label: "Ventes du jour", value: "37" },
  ];
  return (
    <div aria-hidden className="rounded-2xl border border-on-panel/15 bg-paper p-4 text-ink shadow-2xl shadow-black/30 sm:p-5">
      <p className="text-xs font-medium text-muted">Tableau de bord, aujourd&apos;hui</p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl bg-surface p-3">
            <p className="text-[11px] text-muted">{c.label}</p>
            <p className="tabular mt-1 text-base font-semibold">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex h-24 items-end gap-1.5 rounded-xl bg-surface p-3">
        {[38, 52, 44, 70, 58, 82, 64, 90, 76, 96].map((h, i) => (
          <span key={i} className="flex-1 rounded-sm bg-spark-fill/80" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-xl bg-ochre-soft px-3 py-2 text-xs font-medium text-ochre">
        <span>Stock bas : Riz parfumé 5 kg</span>
        <span className="tabular">3 restants</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/85 backdrop-blur supports-[backdrop-filter]:bg-paper/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
          <Logo compact />
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <ButtonLink href="/connexion" variant="ghost" size="sm" className="px-3">
              Se connecter
            </ButtonLink>
            <ButtonLink href="/inscription" size="sm" className="px-4">
              S&apos;inscrire
            </ButtonLink>
          </div>
        </div>
      </header>

      <main>
        <section className="px-3 pt-3 sm:px-4 sm:pt-4">
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-panel text-on-panel">
            <div className="mx-auto grid max-w-6xl gap-10 px-6 pb-10 pt-14 sm:px-10 md:pt-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pb-20 lg:pt-24">
              <div>
                <p className="text-sm font-medium text-on-panel-muted">Pour les boutiques, épiceries et commerces de la zone OHADA</p>
                <h1 className="mt-4 font-display text-[clamp(2.2rem,6vw,4rem)] font-semibold leading-[1.05] tracking-[-0.035em]">
                  Votre commerce, tenu au franc près.
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-on-panel-muted">
                  Gérez tout votre commerce depuis une seule application : stock, ventes, factures, achats, comptabilité et paie. Pour une boutique ou pour plusieurs points de vente, à petit prix, et gratuit pour démarrer.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <ButtonLink href="/inscription" variant="inverse" size="lg">
                    Commencer gratuitement
                    <ArrowRight aria-hidden />
                  </ButtonLink>
                </div>
                <p className="mt-4 text-sm text-on-panel-muted">Aucune carte bancaire demandée.</p>
              </div>
              <DashboardPreview />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <h2 className="max-w-2xl font-display text-[clamp(1.6rem,3.5vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em]">
            De la première vente au bilan, tout part du comptoir.
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-[1.25rem] border border-line bg-surface p-6">
                <span className="grid size-10 place-items-center rounded-xl bg-spark-soft text-spark">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </article>
            ))}
          </div>
          <div className="mt-12 grid gap-4 rounded-[1.25rem] bg-sunken p-6 sm:grid-cols-2 sm:p-8">
            <p className="flex items-start gap-3 text-sm leading-relaxed">
              <Smartphone className="mt-0.5 size-5 shrink-0 text-spark" aria-hidden />
              Pensé d&apos;abord pour le téléphone : la caisse tient dans la main.
            </p>
            <p className="flex items-start gap-3 text-sm leading-relaxed">
              <Mail className="mt-0.5 size-5 shrink-0 text-spark" aria-hidden />
              Factures envoyées par e-mail à vos clients, avec le PDF joint.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:justify-between sm:px-6">
          <p>Comptoir, gestion de commerce</p>
          <p>Fait à Abidjan</p>
        </div>
      </footer>
    </>
  );
}
