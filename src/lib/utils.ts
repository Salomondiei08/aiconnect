import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** URL absolue de l'application (liens des e-mails). */
export function appUrl(path = ""): string {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}

/** « 3 000 FCFA » avec une espace ordinaire (lisible partout, y compris dans le PDF). */
export function formatXof(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const digits = Math.abs(Math.round(amount)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}${digits} FCFA`;
}

/** Date courte JJ/MM/AAAA à l'heure d'Abidjan. */
export function formatDate(date: Date, timeZone = "Africa/Abidjan"): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone, day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}
