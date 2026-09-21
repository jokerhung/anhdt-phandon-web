import { defineConfig, devices } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT ?? "3100";
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: /rate-limit\.spec\.ts/,
  fullyParallel: false,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_USE_EXISTING_SERVER
    ? undefined
    : {
        command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
        url: `${baseURL}/login`,
        reuseExistingServer: true,
        env: {
          ADMIN_USERNAME: "test-admin",
          ADMIN_PASSWORD: "test-password-at-least-16-characters",
          APP_ORIGIN: baseURL,
          NEXT_DIST_DIR: ".next-playwright",
        },
      },
});
