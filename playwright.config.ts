import { defineConfig, devices } from "@playwright/test";
import { E2E_DATABASE_URL, E2E_WEBHOOK_SECRET } from "./e2e/helpers";

/**
 * Tests d'acceptation : le contrat du projet. Fichier verrouillé pendant l'autopilote.
 * E2E_DEV=1 lance `next dev` (boucle rapide) ; sinon le build de production, comme scripts/verify.sh.
 * Les vrais e-mails partent via Resend : RESEND_API_KEY et RESEND_FROM_EMAIL viennent de .env.local.
 */
try {
  process.loadEnvFile(".env.local");
} catch {
  // Pas de .env.local : scripts/verify.sh signale les variables manquantes.
}

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;
const SERVER = process.env.E2E_DEV ? `npx next dev -p ${PORT}` : `npx next start -p ${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  expect: { timeout: 10_000 },
  // Une seule base partagée et un fournisseur réel : un worker rend les échecs reproductibles.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    locale: "fr-FR",
    timezoneId: "Africa/Abidjan",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, grepInvert: /@mobile/ },
    { name: "mobile", use: { ...devices["Pixel 5"] }, grep: /@mobile/ },
  ],
  webServer: {
    command: `npm run db:migrate && ${SERVER}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      APP_URL: BASE_URL,
      RESEND_WEBHOOK_SECRET: E2E_WEBHOOK_SECRET,
      E2E: "1",
    },
  },
});
