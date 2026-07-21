import { expect, test } from "@playwright/test";

test("canonical and analytics consent are production-safe", async ({ page }) => {
  const analyticsRequests: string[] = [];
  page.on("request", (request) => { if (request.url().includes("googletagmanager.com")) analyticsRequests.push(request.url()); });
  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://kutahyasatilik.com");
  await expect(page.getByRole("dialog", { name: "Çerez ve analiz tercihi" })).toBeVisible();
  expect(analyticsRequests).toHaveLength(0);
});

test("filtered listings use the list canonical and API keeps pagination contract", async ({ page, request }) => {
  await page.goto("/ilanlar?tur=daire&sayfa=2");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://kutahyasatilik.com/ilanlar");
  const response = await request.get("/api/v1/listings?page=1&perPage=12");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body).toMatchObject({ ok: true, page: 1, perPage: 12 });
  expect(Array.isArray(body.items)).toBeTruthy();
});

test("app-link manifests are published and the push worker is private", async ({ request }) => {
  const aasa = await request.get("/.well-known/apple-app-site-association");
  expect(aasa.ok()).toBeTruthy();
  const aasaBody = await aasa.json();
  expect(aasaBody).toMatchObject({ applinks: { apps: [] } });
  expect(Array.isArray(aasaBody.applinks.details)).toBeTruthy();

  const assetLinks = await request.get("/.well-known/assetlinks.json");
  expect(assetLinks.ok()).toBeTruthy();
  expect(Array.isArray(await assetLinks.json())).toBeTruthy();

  const worker = await request.post("/api/internal/push/dispatch");
  expect(worker.status()).toBe(401);
});
