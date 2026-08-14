import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import path from "node:path";

// Standalone sunucu (.next/standalone/server.js) .env'i KENDİLİĞİNDEN YÜKLEMEZ —
// canlıda systemd EnvironmentFile veriyor, yerelde veren yok. Bu yüzden e2e,
// kabukta elle `set -a; . ./.env` yapılmadan "AUTH_SECRET must be configured"
// ile açılışta ölüyordu. Env'i burada yükleyip webServer'a geçiriyoruz;
// böylece `npm run test:e2e` tek başına, ek adım olmadan çalışıyor.
loadEnvConfig(process.cwd());

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
