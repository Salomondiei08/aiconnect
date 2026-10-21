import {
  ArrowRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  Clock3,
  Mail,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
} from "lucide-react";
import { AreaChart } from "@/components/charts/area-chart";
import { ColumnChart } from "@/components/charts/bar-chart";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ButtonLink } from "@/components/ui/button";

const features = [
  { icon: ReceiptText, title: "Caisse rapide", text: "Une vente en trois gestes, un reçu PDF prêt à imprimer ou à envoyer par e-mail." },
  { icon: Boxes, title: "Stock à jour", text: "Chaque vente retire les quantités. Les produits sous le seuil d'alerte sont signalés." },
  { icon: BarChart3, title: "Chiffres du jour", text: "Ventes, marge et stock bas sur un seul écran, boutique par boutique." },
  { icon: ShieldCheck, title: "Équipe et rôles", text: "Caissiers, gérants, comptable : chacun ne voit que ce qui le concerne." },
];

const steps = [
  { title: "Créez votre espace", text: "Entreprise, boutique et compte propriétaire en trois étapes guidées.", icon: Store },
  { title: "Ajoutez vos produits", text: "Prix d'achat, prix de vente, quantité et seuil d'alerte.", icon: Boxes },
  { title: "Encaissez", text: "La caisse retire le stock, édite le reçu PDF et l'envoie par e-mail.", icon: ReceiptText },
];

const available = [
  { label: "Caisse espèces et reçu PDF", done: true },
  { label: "Stock décrémenté à la vente", done: true },
  { label: "Facture envoyée par e-mail", done: true },
  { label: "Utilisateurs, rôles et journal", done: true },
  { label: "Tableau de bord et tendances", done: true },
  { label: "Achats fournisseurs", done: false },
  { label: "Ventes à crédit", done: false },
  { label: "Comptabilité SYSCOHADA et paie", done: false },
];

/** Aperçu animé du tableau de bord : de vrais graphiques, pas une image. */
function DashboardPreview() {
  const cards = [
    { label: "Total des ventes", value: "184 500 FCFA" },
    { label: "Marge", value: "52 300 FCFA" },
    { label: "Ventes du jour", value: "37" },
  ];
  const week = [
    { label: "L", value: 38_000 },
    { label: "M", value: 52_000 },
    { label: "M", value: 44_000 },
    { label: "J", value: 70_000 },
    { label: "V", value: 58_000 },
    { label: "S", value: 96_000 },
    { label: "D", value: 64_000 },
  ];
  const passes = [
    { label: "L", value: 12 },
    { label: "M", value: 18 },
    { label: "M", value: 15 },
    { label: "J", value: 26 },
    { label: "V", value: 21 },
    { label: "S", value: 37 },
    { label: "D", value: 24 },
  ];
  return (
    <div aria-hidden className="rounded-2xl border border-on-panel/15 bg-paper p-4 text-ink shadow-2xl shadow-black/30 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted">Tableau de bord, aujourd&apos;hui</p>
        <span className="flex items-center gap-1.5 rounded-full bg-moss-soft px-2.5 py-1 text-[11px] font-semibold text-moss">
          <span className="live-dot size-1.5 rounded-full bg-moss" />
          En direct
        </span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl bg-surface p-3 shadow-[var(--shadow-xs)]">
            <p className="text-[11px] text-muted">{c.label}</p>
            <p className="tabular mt-1 text-base font-semibold">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl bg-surface p-3 shadow-[var(--shadow-xs)]">
        <AreaChart data={week} height={104} valueFormat="xofShort" className="pointer-events-none" />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1.1fr_1fr]">
        <div className="rounded-xl bg-surface p-3 shadow-[var(--shadow-xs)]">
          <p className="mb-1 text-[11px] text-muted">Passages en caisse</p>
          <ColumnChart data={passes} height={84} valueFormat="count" className="pointer-events-none" />
        </div>
        <div className="flex flex-col justify-between gap-2 rounded-xl bg-ochre-soft px-3 py-2.5 text-xs font-medium text-ochre">
          <span className="flex items-center gap-2">
            <Boxes className="size-4 shrink-0" />
            Stock bas : Riz parfumé 5 kg
          </span>
          <span className="tabular">3 restants</span>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <header className="glass-paper sticky top-0 z-40 border-b border-line/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
          <Logo compact />
          <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
            {[
              { href: "#fonctions", label: "Fonctions" },
              { href: "#methode", label: "Comment ça marche" },
              { href: "#modules", label: "Modules" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="min-h-11 rounded-full px-3.5 text-sm font-medium text-muted transition-colors hover:bg-sunken hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </nav>
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
            <div className="aurora" aria-hidden />
            <div className="grid-lines-panel pointer-events-none absolute inset-0" aria-hidden />
            <div className="relative mx-auto grid max-w-6xl gap-10 px-6 pb-10 pt-14 sm:px-10 md:pt-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pb-20 lg:pt-24">
              <div>
                <Reveal>
                  <p className="inline-flex items-center gap-2 rounded-full border border-on-panel/20 bg-on-panel/5 px-3 py-1.5 text-xs font-medium text-on-panel-muted">
                    <Sparkles className="size-3.5 text-spark-fill" aria-hidden />
                    Pour les boutiques, épiceries et commerces de la zone OHADA
                  </p>
                </Reveal>
                <Reveal delay={70}>
                  <h1 className="mt-5 font-display text-[clamp(2.2rem,6vw,4rem)] font-semibold leading-[1.05] tracking-[-0.035em]">
                    Votre commerce, <span className="text-sheen-panel">tenu au franc près.</span>
                  </h1>
                </Reveal>
                <Reveal delay={140}>
                  <p className="mt-6 max-w-xl text-lg leading-relaxed text-on-panel-muted">
                    Gérez tout votre commerce depuis une seule application : stock, ventes, factures, achats, comptabilité et paie. Pour une
                    boutique ou pour plusieurs points de vente, à petit prix, et gratuit pour démarrer.
                  </p>
                </Reveal>
                <Reveal delay={210}>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <ButtonLink href="/inscription" variant="inverse" size="lg" className="sweep">
                      Commencer gratuitement
                      <ArrowRight aria-hidden />
                    </ButtonLink>
                    <ButtonLink href="/connexion" variant="onPanel" size="lg">
                      Se connecter
                    </ButtonLink>
                  </div>
                </Reveal>
                <Reveal delay={280}>
                  <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-on-panel-muted">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-4 text-spark-fill" aria-hidden /> Aucune carte bancaire demandée
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="size-4 text-spark-fill" aria-hidden /> Pensé pour le téléphone
                    </span>
                  </p>
                </Reveal>
              </div>
              <Reveal delay={180} className="animate-float">
                <DashboardPreview />
              </Reveal>
            </div>
          </div>
        </section>

        <section id="fonctions" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 lg:py-24">
          <Reveal>
            <h2 className="max-w-2xl font-display text-[clamp(1.6rem,3.5vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em]">
              De la première vente au bilan, tout part du comptoir.
            </h2>
          </Reveal>
          <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" step={80}>
            {features.map(({ icon: Icon, title, text }) => (
              <article key={title} className="card-lift h-full rounded-[1.25rem] border border-line bg-surface p-6 shadow-[var(--shadow-xs)]">
                <span className="grid size-10 place-items-center rounded-xl bg-spark-soft text-spark transition-transform duration-300 hover:scale-110">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
              </article>
            ))}
          </Stagger>
          <Reveal delay={80}>
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
          </Reveal>
        </section>

        <section id="methode" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-6 lg:pb-24">
          <Reveal>
            <h2 className="font-display text-[clamp(1.5rem,3vw,2rem)] font-semibold leading-tight tracking-[-0.02em]">
              Trois gestes, et la boutique est en ligne.
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <Reveal key={step.title} delay={index * 90}>
                <div className="card-lift relative h-full overflow-hidden rounded-[1.25rem] border border-line bg-surface p-6">
                  <span aria-hidden className="absolute -right-6 -top-8 font-display text-[5.5rem] font-bold text-sunken">
                    {index + 1}
                  </span>
                  <span className="relative grid size-10 place-items-center rounded-xl bg-brand-soft text-ink">
                    <step.icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="relative mt-4 font-semibold">{step.title}</h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="modules" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-6 lg:pb-24">
          <Reveal>
            <div className="rounded-[1.5rem] border border-line bg-surface p-6 sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-[clamp(1.4rem,3vw,1.9rem)] font-semibold leading-tight tracking-[-0.02em]">
                    Ce qui fonctionne aujourd&apos;hui
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                    Le premier lot couvre le parcours commercial complet. Les modules comptables arrivent ensuite, et ne sont pas annoncés
                    comme opérationnels tant qu&apos;ils ne le sont pas.
                  </p>
                </div>
                <Badge tone="spark">
                  <Clock3 className="size-3.5" aria-hidden /> Mise à jour continue
                </Badge>
              </div>
              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {available.map((item) => (
                  <li
                    key={item.label}
                    className={`flex items-center gap-2.5 rounded-xl px-3.5 py-3 text-sm ${
                      item.done ? "bg-moss-soft/60 text-ink" : "bg-sunken text-muted"
                    }`}
                  >
                    {item.done ? (
                      <CheckCircle2 className="size-[18px] shrink-0 text-moss" aria-hidden />
                    ) : (
                      <Clock3 className="size-[18px] shrink-0" aria-hidden />
                    )}
                    <span className="font-medium">{item.label}</span>
                    <span className="ml-auto text-[11px] font-semibold uppercase tracking-wide">{item.done ? "Disponible" : "Bientôt"}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </section>

        <section className="px-3 pb-4 sm:px-4">
          <Reveal>
            <div className="relative isolate overflow-hidden rounded-[2rem] bg-panel px-6 py-12 text-on-panel sm:px-10 sm:py-16">
              <div className="aurora" aria-hidden />
              <div className="relative mx-auto flex max-w-3xl flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-[clamp(1.5rem,3.4vw,2.1rem)] font-semibold leading-tight tracking-[-0.02em]">
                    Ouvrez votre comptoir en deux minutes.
                  </h2>
                  <p className="mt-3 max-w-lg text-on-panel-muted">
                    Créez votre entreprise, ajoutez vos premiers produits et encaissez votre première vente dans la foulée.
                  </p>
                </div>
                <ButtonLink href="/inscription" variant="inverse" size="lg" className="sweep shrink-0">
                  Commencer gratuitement
                  <ArrowRight aria-hidden />
                </ButtonLink>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              Gestion de commerce pour les boutiques, épiceries et points de vente de la zone OHADA.
            </p>
          </div>
          <nav aria-label="Produit" className="text-sm">
            <p className="font-semibold">Produit</p>
            <ul className="mt-3 space-y-2 text-muted">
              <li><a href="#fonctions" className="transition-colors hover:text-ink">Fonctions</a></li>
              <li><a href="#methode" className="transition-colors hover:text-ink">Comment ça marche</a></li>
              <li><a href="#modules" className="transition-colors hover:text-ink">Modules</a></li>
              <li><a href="/connexion" className="transition-colors hover:text-ink">Se connecter</a></li>
            </ul>
          </nav>
          <nav aria-label="Compte" className="text-sm">
            <p className="font-semibold">Compte</p>
            <ul className="mt-3 space-y-2 text-muted">
              <li><a href="/inscription" className="transition-colors hover:text-ink">S&apos;inscrire</a></li>
              <li><a href="/mot-de-passe-oublie" className="transition-colors hover:text-ink">Mot de passe oublié</a></li>
              <li><a href="/tableau-de-bord" className="transition-colors hover:text-ink">Tableau de bord</a></li>
            </ul>
          </nav>
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:justify-between sm:px-6">
            <p>Comptoir, gestion de commerce</p>
            <p>Fait à Abidjan</p>
          </div>
        </div>
      </footer>
    </>
  );
}
