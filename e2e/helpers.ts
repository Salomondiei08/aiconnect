import { expect, type Locator, type Page } from "@playwright/test";

/** Mot de passe conforme à RG3, utilisé par défaut dans tous les tests. */
export const PASSWORD = "Erp!2026demo";

const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://localhost:8025";

/** Identifiant court et unique : chaque test crée sa propre entreprise, donc pas de reset de base. */
export function uniq(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Libellé tolérant : casse ignorée, apostrophe droite ou typographique, astérisque final optionnel.
 * Le texte reste un contrat exact (ancré au début et à la fin).
 */
export function L(text: string): RegExp {
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/'/g, "['’]");
  return new RegExp(`^\\s*${escaped}\\s*\\*?\\s*$`, "i");
}

/** « E-mail » ou « Email ». */
export const EMAIL_LABEL = /^\s*e-?mail\s*\*?\s*$/i;

/** « Confirmation du mot de passe » (inscription) ou « Confirmez le mot de passe » (utilisateurs). */
export const CONFIRM_LABEL = /^\s*(confirmation du|confirmez le) mot de passe\s*\*?\s*$/i;

/** Lien ou bouton : l'agent choisit l'élément, le test ne vérifie que le nom accessible. */
export function action(scope: Page | Locator, name: RegExp): Locator {
  return scope.getByRole("link", { name }).or(scope.getByRole("button", { name })).first();
}

/** Ne garde que les chiffres : « 3 000 FCFA » devient « 3000 ». */
export async function digits(locator: Locator): Promise<string> {
  return ((await locator.textContent()) ?? "").replace(/\D/g, "");
}

/** Valeur affichée par un champ, qu'il soit <select> natif, <input> ou combobox shadcn. */
export async function fieldText(field: Locator): Promise<string> {
  return field.evaluate((el) => {
    if (el instanceof HTMLSelectElement) return `${el.value} ${el.options[el.selectedIndex]?.text ?? ""}`;
    if (el instanceof HTMLInputElement) return el.value;
    return el.textContent ?? "";
  });
}

/** Choisit une option dans un <select> natif ou une combobox (shadcn/Radix). */
export async function pickOption(page: Page, label: RegExp, option: string): Promise<void> {
  const field = page.getByLabel(label);
  const tag = await field.evaluate((el) => el.tagName);
  if (tag === "SELECT") {
    await field.selectOption({ label: option });
    return;
  }
  await field.click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

export type Owner = {
  company: string;
  firstName: string;
  username: string;
  email: string;
  password: string;
};

export function newOwner(): Owner {
  const id = uniq();
  return {
    company: `Boutique ${id}`,
    firstName: `Awa${id}`,
    username: `owner_${id}`,
    email: `owner-${id}@example.test`,
    password: PASSWORD,
  };
}

/** Remplit les étapes 1 et 2 (valeurs par défaut) et s'arrête au début de l'étape 3. */
export async function signupUntilStep3(page: Page, owner: Owner): Promise<void> {
  await page.goto("/inscription");
  await page.getByLabel(L("Nom de l'entreprise")).fill(owner.company);
  await page.getByLabel(L("Commune")).fill("Cocody");
  await page.getByLabel(L("Ville")).fill("Abidjan");
  await page.getByLabel(L("Code postal")).fill("00000");
  await page.getByLabel(L("Point de repère")).fill("Près de la pharmacie");
  await page.getByRole("button", { name: L("Suivant") }).click();

  await expect(page.getByLabel(L("Méthode comptable"))).toBeVisible();
  await page.getByRole("button", { name: L("Suivant") }).click();

  await expect(page.getByLabel(L("Prénom"))).toBeVisible();
}

/** Remplit l'étape 3 sans valider. */
export async function fillOwnerStep(page: Page, owner: Owner, confirm = owner.password): Promise<void> {
  await page.getByLabel(L("Prénom")).fill(owner.firstName);
  await page.getByLabel(L("Nom d'utilisateur")).fill(owner.username);
  await page.getByLabel(EMAIL_LABEL).fill(owner.email);
  await page.getByLabel(L("Mot de passe")).fill(owner.password);
  await page.getByLabel(CONFIRM_LABEL).fill(confirm);
}

/** Inscription complète : finit connecté sur le tableau de bord. */
export async function signup(page: Page, owner: Owner = newOwner()): Promise<Owner> {
  await signupUntilStep3(page, owner);
  await fillOwnerStep(page, owner);
  await page.getByRole("button", { name: L("S'inscrire") }).click();
  await expect(page).toHaveURL(/\/tableau-de-bord/, { timeout: 20_000 });
  return owner;
}

/** Remplit le formulaire de connexion et valide. N'affirme rien sur le résultat. */
export async function login(page: Page, username: string, password: string): Promise<void> {
  await page.goto("/connexion");
  await page.getByLabel(L("Nom d'utilisateur")).fill(username);
  await page.getByLabel(L("Mot de passe")).fill(password);
  await page.getByRole("button", { name: L("Se connecter") }).click();
}

/** Déconnexion côté navigateur : plus de cookie, plus de session. */
export async function logout(page: Page): Promise<void> {
  await page.context().clearCookies();
}

export type Mail = { subject: string; text: string; html: string };

/** Attend dans Mailpit un e-mail pour `to` dont le sujet correspond, et renvoie son contenu. */
export async function waitForEmail(to: string, subject: RegExp, timeoutMs = 20_000): Promise<Mail> {
  const deadline = Date.now() + timeoutMs;
  const query = encodeURIComponent(`to:"${to}"`);
  while (Date.now() < deadline) {
    const res = await fetch(`${MAILPIT_URL}/api/v1/search?query=${query}`);
    if (res.ok) {
      const body = (await res.json()) as { messages?: { ID: string; Subject: string }[] };
      const hit = body.messages?.find((m) => subject.test(m.Subject));
      if (hit) {
        const msg = (await (await fetch(`${MAILPIT_URL}/api/v1/message/${hit.ID}`)).json()) as {
          Subject: string;
          Text?: string;
          HTML?: string;
        };
        return { subject: msg.Subject, text: msg.Text ?? "", html: msg.HTML ?? "" };
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Aucun e-mail ${subject} reçu par ${to} dans Mailpit (${MAILPIT_URL}) après ${timeoutMs} ms`);
}

/** Premier lien http(s) de l'e-mail qui correspond au motif. */
export function findLink(mail: Mail, pattern: RegExp): string {
  const body = `${mail.text}\n${mail.html.replace(/&amp;/g, "&")}`;
  const link = (body.match(/https?:\/\/[^\s"'<>)]+/g) ?? []).find((l) => pattern.test(l));
  if (!link) throw new Error(`Aucun lien ${pattern} dans l'e-mail « ${mail.subject} »`);
  return link;
}

export type StaffUser = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  role: "Admin" | "Gérant" | "Caissier" | "Comptable" | "RH";
  active?: boolean;
};

export function newStaff(overrides: Partial<StaffUser> = {}): StaffUser {
  const id = uniq();
  return {
    firstName: `Kofi${id}`,
    lastName: `Zed${id}`,
    email: `staff-${id}@example.test`,
    username: `staff_${id}`,
    password: PASSWORD,
    role: "Caissier",
    ...overrides,
  };
}

/** Remplit et soumet « Ajouter un utilisateur ». N'affirme rien sur le résultat. */
export async function submitStaff(page: Page, user: StaffUser): Promise<void> {
  await page.goto("/utilisateurs");
  await action(page, L("Ajouter")).click();
  await expect(page.getByRole("heading", { name: /ajouter un utilisateur/i })).toBeVisible();
  await page.getByLabel(L("Prénom")).fill(user.firstName);
  await page.getByLabel(L("Nom de famille")).fill(user.lastName);
  await page.getByLabel(EMAIL_LABEL).fill(user.email);
  if (user.active === false) await page.getByLabel(L("Est actif")).uncheck();
  await page.getByLabel(L("Nom d'utilisateur")).fill(user.username);
  await page.getByLabel(L("Mot de passe")).fill(user.password);
  await page.getByLabel(CONFIRM_LABEL).fill(user.password);
  await pickOption(page, L("Rôle"), user.role);
  await page.getByRole("button", { name: L("Sauvegarder") }).click();
}

/** Ajoute un produit depuis /produits et attend sa ligne dans le tableau. */
export async function addProduct(
  page: Page,
  product: { name: string; purchase: number; sale: number; qty: number; min?: number },
): Promise<void> {
  await page.goto("/produits");
  await action(page, /ajouter un produit/i).click();
  await page.getByLabel(L("Nom du produit")).fill(product.name);
  await page.getByLabel(L("Prix d'achat")).fill(String(product.purchase));
  await page.getByLabel(L("Prix de vente")).fill(String(product.sale));
  await page.getByLabel(L("Quantité initiale")).fill(String(product.qty));
  if (product.min !== undefined) await page.getByLabel(L("Stock minimum")).fill(String(product.min));
  await page.getByRole("button", { name: L("Sauvegarder") }).click();
  await expect(page.getByRole("row").filter({ hasText: product.name })).toBeVisible();
}

/** Lit le stock d'un produit dans /produits. */
export async function stockOf(page: Page, name: string): Promise<string> {
  await page.goto("/produits");
  return digits(page.getByRole("row").filter({ hasText: name }).getByTestId("stock-qty"));
}

/** Aucune page ne doit déborder horizontalement (règle mobile d'abord). */
export async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}
