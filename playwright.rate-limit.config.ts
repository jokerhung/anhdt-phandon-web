import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3001";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /rate-limit\.spec\.ts/,
  workers: 1,
  use: { baseURL, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3001",
    url: `${baseURL}/login`,
    reuseExistingServer: false,
    env: {
      ADMIN_USERNAME: "test-admin",
      ADMIN_PASSWORD: "test-password-at-least-16-characters",
      APP_ORIGIN: baseURL,
      NEXT_DIST_DIR: ".next-playwright-rate",
    },
  },
});
