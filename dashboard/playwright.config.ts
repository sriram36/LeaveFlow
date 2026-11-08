import { defineConfig } from "@playwright/test";

/**
 * Browser tests for the dashboard. They need the whole app running with the demo data:
 *
 *   docker compose up --build -d db backend
 *   docker compose exec backend python scripts/seed_demo.py
 *   npm run build && npm start        # dashboard on http://localhost:3000
 *   npm run test:e2e
 *
 * The tests use the shared demo account and reset the demo data, so only run them against a
 * database you are happy to do that to. Set E2E_BASE_URL / E2E_API_URL to point elsewhere.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
});
