import { defineConfig, devices } from "@playwright/test";

// End-to-end checks as a guest, read-only: they never sign in or write, so
// they can run against production. E2E_BASE_URL picks the target (CI passes
// the fresh Vercel deployment); locally it is the dev server.
export default defineConfig({
  testDir: "e2e",
  testMatch: "*.e2e.ts", // not *.spec.ts, which Vitest would pick up
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
});
