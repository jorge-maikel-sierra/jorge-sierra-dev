import { defineConfig, devices } from "@playwright/test";

const port = 3200;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `pnpm build && pnpm start --port ${port}`,
        timeout: 180_000,
        // Cloudflare's documented always-pass Turnstile keys and a local fake
        // n8n (tests/e2e/contact-pipeline.spec.ts). Real Supabase and Upstash
        // come from .env.local when present.
        env: {
          NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
          TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
          N8N_CONTACT_WEBHOOK_URL: "http://127.0.0.1:3401/webhook",
          N8N_WEBHOOK_SECRET: "e2e-webhook-secret",
        },
        port,
        reuseExistingServer: !process.env.CI,
      },
});
