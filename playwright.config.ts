import { defineConfig, devices } from "@playwright/test";

/**
 * Tests d'acceptation : le contrat du projet. Fichier verrouillé pendant le live.
 * E2E_DEV=1 lance `next dev` (boucle rapide) ; sinon le build de production, comme scripts/verify.sh.
 */
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;
const SERVER = process.env.E2E_DEV ? `npx next dev -p ${PORT}` : `npx next start -p ${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // SQLite + une seule base : un worker évite les verrous et rend les échecs reproductibles.
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
    command: `rm -rf .e2e && mkdir -p .e2e && npm run db:migrate && ${SERVER}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      DATABASE_URL: "file:.e2e/e2e.db",
      APP_URL: BASE_URL,
      BETTER_AUTH_URL: BASE_URL,
      BETTER_AUTH_SECRET: "e2e-secret-not-for-production-0123456789abcdef",
      SMTP_HOST: "localhost",
      SMTP_PORT: "1025",
      SMTP_USER: "",
      SMTP_PASS: "",
      MAIL_FROM: "ERP <no-reply@example.test>",
      E2E: "1",
    },
  },
});
