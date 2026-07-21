import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://127.0.0.1:3017", trace: "retain-on-failure" },
  webServer: {
    command: "npm run prepare:standalone && HOSTNAME=127.0.0.1 PORT=3017 npm run start:standalone",
    url: "http://127.0.0.1:3017/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
