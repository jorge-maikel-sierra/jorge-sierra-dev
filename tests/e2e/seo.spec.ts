import { expect, test } from "@playwright/test";

test("title and description match across <title>, Open Graph and Twitter", async ({
  page,
}) => {
  await page.goto("/es");
  const meta = (selector: string) =>
    page.locator(selector).getAttribute("content");

  const title = await page.title();
  expect(await meta('meta[property="og:title"]')).toBe(title);
  expect(await meta('meta[name="twitter:title"]')).toBe(title);

  const description = await meta('meta[name="description"]');
  expect(description).toBeTruthy();
  expect(await meta('meta[property="og:description"]')).toBe(description);
  expect(await meta('meta[name="twitter:description"]')).toBe(description);
});

test("publishes Person structured data", async ({ page }) => {
  await page.goto("/es");
  const raw = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  const person = JSON.parse(raw ?? "{}");
  expect(person["@type"]).toBe("Person");
  expect(person.sameAs).toContain("https://github.com/jorge-maikel-sierra");
});

test("serves the generated share image, sitemap and robots", async ({
  request,
}) => {
  const og = await request.get("/es/opengraph-image");
  expect(og.headers()["content-type"]).toContain("image/png");
  expect((await request.get("/sitemap.xml")).ok()).toBe(true);
  expect(await (await request.get("/robots.txt")).text()).toContain(
    "Sitemap: https://jorge-sierra.dev/sitemap.xml",
  );
});
