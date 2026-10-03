import { expect, test } from "@playwright/test";

// Task 2.5. Headless Chromium renders with SwiftShader, which detect-gpu
// blocklists (tier 0): a real low-end case, not a mock.

const fallback = (page: import("@playwright/test").Page) =>
  page.locator("section[aria-labelledby='hero-title'] svg").first();

test("tier 0 keeps the static fallback and never mounts WebGL", async ({
  page,
  isMobile,
}) => {
  await page.goto("/es");
  await page.waitForTimeout(2500);
  await expect(page.locator("canvas")).toHaveCount(0);
  if (!isMobile) await expect(fallback(page)).toBeVisible();
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
});

test("prefers-reduced-motion shows the final state statically", async ({
  browser,
}) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/es");
  await page.waitForTimeout(2500);
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  expect(
    await page.evaluate(() => document.documentElement.classList.contains("lenis")),
  ).toBe(false);
  await context.close();
});

test("GPU benchmarks are served locally, never from a third-party CDN", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("unpkg.com")) external.push(request.url());
  });
  await page.goto("/es");
  await page.waitForTimeout(2500);
  expect(external).toEqual([]);
});
