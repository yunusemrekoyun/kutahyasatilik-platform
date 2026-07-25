import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://127.0.0.1:3017", trace: "retain-on-failure" },
  webServer: {
    command: "npm run prepare:standalone && HOSTNAME=127.0.0.1 PORT=3017 npm run start:standalone",
    url: "http://127.0.0.1:3017/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      ANDROID_APP_LINK_SHA256_CERT_FINGERPRINTS: "",
      APPLE_TEAM_ID: "",
      UPLOAD_DIR: path.join(process.cwd(), "public", "uploads"),
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
