import { expect, test } from "@playwright/test";

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "laptop", width: 1024, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

for (const viewport of viewports) {
  test(`editorial surfaces render without horizontal overflow — ${viewport.name}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    for (const [name, path] of [["home", "/"], ["listings", "/ilanlar"], ["seller", "/satici"], ["login", "/giris"]] as const) {
      await page.goto(path);
      await expect(page.locator("body")).toBeVisible();
      const consent = page.getByRole("button", { name: /yalnız gerekli/i });
      if (await consent.isVisible().catch(() => false)) await consent.click();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      await testInfo.attach(`${viewport.name}-${name}`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    }

    await page.goto("/ilanlar");
    const detailHref = await page.locator('a[href^="/ilan/"]').first().getAttribute("href");
    if (detailHref) {
      await page.goto(detailHref);
      await expect(page.locator("h1")).toBeVisible();
      await testInfo.attach(`${viewport.name}-detail`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    }
  });
}
