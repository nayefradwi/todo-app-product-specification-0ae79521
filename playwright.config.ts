import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for the todo-app's end-to-end test suite.
 *
 * Runs the specs under `e2e/` against a Next.js dev server on
 * `http://localhost:3000`. The dev server is started/stopped automatically
 * by Playwright's `webServer` block unless `PLAYWRIGHT_BASE_URL` is set,
 * in which case tests run against an already-running deployment (e.g. a
 * Vercel preview URL or a local production server you started yourself).
 *
 * Usage:
 *   - `npm run test:e2e`                 → boots `next dev` and runs tests
 *   - `PLAYWRIGHT_BASE_URL=https://...` `npm run test:e2e` → runs against the URL
 *
 * Browsers are NOT installed by `npm install`. Run
 * `npx playwright install --with-deps chromium` once before the first run
 * (a one-time ~150 MB download).
 *
 * The DATABASE_URL env var must be exported (or in `.env.local`) so the
 * spawned Next.js server can connect to Postgres. The test creates a fresh
 * user per run with a unique email, so it does not require a seeded
 * account and will not collide with other test runs.
 */

const PORT = Number(process.env.PORT ?? 3000);
const DEFAULT_BASE_URL = `http://localhost:${PORT}`;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? DEFAULT_BASE_URL;

// When the user points us at an already-running deployment we must not try
// to spawn our own dev server.
const useExternalServer = Boolean(process.env.PLAYWRIGHT_BASE_URL);

export default defineConfig({
  testDir: "./e2e",
  // The persistence flow exercises four full page navigations plus several
  // network round-trips, so give each test a generous overall budget.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: useExternalServer
    ? undefined
    : {
        // `next dev` is sufficient for E2E coverage and starts faster than
        // `next build && next start`. Override by exporting
        // PLAYWRIGHT_BASE_URL if you'd rather hit a production-mode server.
        command: `npm run dev -- --port ${PORT}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
