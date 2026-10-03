import { expect, test } from "@playwright/test";

// Task 6.1: English version, hreflang and the agent speaking the page locale.

test("the English home renders the translated content", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", { level: 1, name: "From chaos to architecture." }),
  ).toBeVisible();
  await expect(page.getByLabel("Ask my agent")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Real problems/ })).toBeVisible();
  await expect(page.getByText("Open to new challenges")).toBeVisible();
});

test("both locales publish hreflang alternates and their own canonical", async ({ page }) => {
  for (const locale of ["es", "en"]) {
    await page.goto(`/${locale}`);
    const href = (lang: string) =>
      page.locator(`link[rel="alternate"][hreflang="${lang}"]`).getAttribute("href");
    expect(await href("es")).toMatch(/\/es$/);
    expect(await href("en")).toMatch(/\/en$/);
    expect(await href("x-default")).toMatch(/\/es$/);
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toMatch(
      new RegExp(`/${locale}$`),
    );
  }
});

test("the agent sends the page locale", async ({ page }) => {
  let body: { locale?: string } = {};
  await page.route("**/api/agent", async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({ status: 503, json: { error: "budget" } });
  });
  await page.goto("/en");
  await page.getByLabel("Ask my agent").fill("Has he worked with queues?");
  await page.getByRole("button", { name: "Analyze" }).click();
  await expect(page.locator("#agente").getByRole("alert")).toContainText(
    "The agent is resting for today.",
  );
  expect(body.locale).toBe("en");
});

test("the sitemap lists both locales with alternates", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain("https://jorge-sierra.dev/es");
  expect(xml).toContain("https://jorge-sierra.dev/en");
  expect(xml).toContain('hreflang="x-default"');
});

test("hreflang only lives in the HTML, never in a Link header with the request host", async ({
  request,
}) => {
  // Otherwise Lighthouse sees the canonical point to "another hreflang location".
  const response = await request.get("/es");
  expect(response.headers().link ?? "").not.toContain("hreflang");
});
