import { execFileSync } from "node:child_process";
import { createHmac, randomUUID } from "node:crypto";
import { expect, type Locator, type Page } from "@playwright/test";
import { Pool } from "pg";

/** Mot de passe conforme à RG3, utilisé par défaut dans tous les tests. */
export const PASSWORD = "Erp!2026demo";

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
    email: testAddress(`owner-${id}`),
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

/**
 * Adresses de test Resend : de vrais envois, livrés par Resend sans toucher une vraie boîte.
 * Le libellé après « + » rend chaque adresse unique (contrainte d'unicité des e-mails).
 */
export function testAddress(label: string): string {
  return `delivered+${label}@resend.dev`;
}

/** Base PostgreSQL dédiée aux tests (recréée par scripts/verify.sh). */
export const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? "postgresql://erp:erp_local_only@localhost:5434/erp_e2e?schema=public";

/** Secret webhook propre aux tests : les vrais webhooks Resend n'atteignent pas localhost. */
export const E2E_WEBHOOK_SECRET = `whsec_${Buffer.from("e2e-webhook-secret-0123456789abcdef").toString("base64")}`;

let pool: Pool | undefined;

/** Requête SQL directe : les tests vérifient ce qui est réellement persisté dans PostgreSQL. */
export async function sql<T extends Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  pool ??= new Pool({ connectionString: E2E_DATABASE_URL, max: 2 });
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export type EmailDelivery = {
  id: string;
  type: string;
  to: string;
  subject: string;
  status: string;
  resendId: string | null;
  attempts: number;
  error: string | null;
  attachments: { filename: string; size: number; contentType?: string }[] | null;
};

/** Attend la ligne EmailDelivery acceptée par Resend (resendId renseigné) pour ce destinataire et ce type. */
export async function waitForDelivery(to: string, type: string, timeoutMs = 30_000): Promise<EmailDelivery> {
  const deadline = Date.now() + timeoutMs;
  let last: EmailDelivery | undefined;
  while (Date.now() < deadline) {
    [last] = await sql<EmailDelivery>(
      `select * from "EmailDelivery" where "to" = $1 and "type" = $2 order by "createdAt" desc limit 1`,
      [to, type],
    );
    if (last?.resendId) return last;
    if (last?.status === "failed") break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`EmailDelivery ${type} pour ${to} sans resendId : ${JSON.stringify(last ?? null)}`);
}

export type ProviderEmail = {
  id: string;
  to: string[];
  subject: string;
  html: string | null;
  text: string | null;
  last_event: string;
};

/**
 * Lit l'e-mail chez Resend avec la CLI `resend` (identifiants de l'humain, pas la clé d'envoi de l'app).
 * RESEND_API_KEY est retiré de l'environnement pour que la CLI utilise son profil.
 */
export function resendCli<T>(args: string[]): T {
  const env = { ...process.env };
  delete env.RESEND_API_KEY;
  const out = execFileSync("resend", [...args, "--json"], { env, encoding: "utf8" });
  return JSON.parse(out) as T;
}

/** Attend que Resend rapporte l'événement voulu (par défaut : livré). L'acceptation API ne suffit pas. */
export async function waitForProviderEvent(resendId: string, event = "delivered", timeoutMs = 90_000): Promise<ProviderEmail> {
  const deadline = Date.now() + timeoutMs;
  let last: ProviderEmail | undefined;
  while (Date.now() < deadline) {
    try {
      last = resendCli<ProviderEmail>(["emails", "get", resendId]);
      if (last.last_event === event) return last;
    } catch {
      // L'e-mail peut ne pas être encore lisible juste après l'envoi.
    }
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  throw new Error(`Resend n'a pas rapporté « ${event} » pour ${resendId} (dernier : ${last?.last_event ?? "aucun"})`);
}

/** Premier lien http(s) du contenu qui correspond au motif. */
export function findLink(email: Pick<ProviderEmail, "html" | "text" | "subject">, pattern: RegExp): string {
  const body = `${email.text ?? ""}\n${(email.html ?? "").replace(/&amp;/g, "&")}`;
  const link = (body.match(/https?:\/\/[^\s"'<>()\[\]]+/g) ?? []).find((l) => pattern.test(l));
  if (!link) throw new Error(`Aucun lien ${pattern} dans l'e-mail « ${email.subject} »`);
  return link;
}

/** En-têtes Svix signés comme Resend le fait, pour appeler le webhook local. */
export function signWebhook(body: string, secret = E2E_WEBHOOK_SECRET, id = `msg_${randomUUID()}`) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const signature = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64");
  return { "content-type": "application/json", "svix-id": id, "svix-timestamp": timestamp, "svix-signature": `v1,${signature}` };
}

/** Événement webhook Resend minimal. */
export function webhookEvent(type: string, emailId: string, createdAt = new Date()): string {
  return JSON.stringify({
    type,
    created_at: createdAt.toISOString(),
    data: { email_id: emailId, created_at: createdAt.toISOString(), to: ["delivered@resend.dev"], subject: "test" },
  });
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
    email: testAddress(`staff-${id}`),
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
