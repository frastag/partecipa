import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env["E2E_BASE_URL"] ?? "http://localhost:3000";

// Runs against the production build, so the strict CSP and server rendering are what's tested.
// Needs the local stack (infra/compose.yaml) for Valkey.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  reporter: [["list"]],
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    { name: "phone", use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 800 } } },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } },
    },
  ],
  webServer: {
    command: "npm run build && npm start",
    url: `${baseURL}/healthz`,
    reuseExistingServer: true,
    env: { PORT: "3000", NODE_ENV: "production" },
  },
});
