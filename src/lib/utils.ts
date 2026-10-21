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

/** Date et heure courtes JJ/MM/AAAA HH:MM dans le fuseau indiqué. */
export function formatDateTime(date: Date, timeZone = "Africa/Abidjan"): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone, day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

/** Heure courte HH:MM. */
export function formatTime(date: Date, timeZone = "Africa/Abidjan"): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone, hour: "2-digit", minute: "2-digit" }).format(date);
}

/** « il y a 3 h », « hier », « 12/03 » : datation relative lisible dans les journaux. */
export function formatRelative(date: Date, now = new Date()): string {
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "à l'instant";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days === 1) return "hier";
  if (days < 30) return `il y a ${days} jours`;
  return formatDate(date);
}
