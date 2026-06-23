import { defineConfig, devices } from "@playwright/test";

import { loadLocalE2eEnv } from "./e2e/lib/load-local-env";
import { resolveE2eTestMode } from "./e2e/lib/supabase-project-guard";

loadLocalE2eEnv();

const port = Number(process.env.E2E_PORT ?? 3002);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port}`;
const e2eTestMode = resolveE2eTestMode();
/** When set (local authenticated script), never reuse a warm dev/next start on the port. */
const freshServer = Boolean(process.env.E2E_FRESH_SERVER);

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI || e2eTestMode === "authenticated" ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: e2eTestMode === "authenticated" ? "off" : "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `bash -lc 'set -a && [ -f .env.e2e.local ] && . ./.env.e2e.local; set +a && exec npm run start -- -p ${port}'`,
        url: baseURL,
        reuseExistingServer: !process.env.CI && !freshServer,
        timeout: 120_000,
      },
});
