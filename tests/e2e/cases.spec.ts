import { expect, test, type Page } from "@playwright/test";

// Case studies as a pinned 3D coverflow (grid without JS or with reduced motion).

const coverflow = (page: Page) => page.locator("[data-coverflow]");
const cards = (page: Page) => page.locator("[data-cf-item]");
const activeDot = (page: Page) =>
  page.locator(".cf-dot").evaluateAll((dots) => dots.findIndex((dot) => dot.classList.contains("is-active")));

/** Scrolls to a fraction (0–1) of the pinned travel and waits for a frame. */
async function scrollTravel(page: Page, fraction: number) {
  await page.evaluate((f) => {
    const section = document.querySelector<HTMLElement>("[data-coverflow]")!;
    const sticky = section.querySelector<HTMLElement>(".cf-sticky")!;
    const start = section.getBoundingClientRect().top + window.scrollY;
    // The site scrolls smoothly; measure at the target position.
    window.scrollTo({ top: start + (section.offsetHeight - sticky.offsetHeight) * f, behavior: "instant" });
  }, fraction);
  await page.waitForTimeout(150);
}

test.describe("case studies", () => {
  test("lists the five cases in file order, all the same height", async ({ page }) => {
    await page.goto("/es");
    await expect(cards(page)).toHaveCount(5);
    await expect(cards(page).getByRole("heading", { level: 3 })).toHaveText([
      "Paga Diario",
      "Chatbot de WhatsApp con visión",
      "NetPlan",
      "Pizzería Horebs",
      "AI Support Automation Platform",
    ]);
    const heights = await cards(page).evaluateAll((items) => items.map((item) => (item as HTMLElement).offsetHeight));
    expect(new Set(heights).size).toBe(1);
    await expect(page.locator("#case-panel-paga-diario")).toBeVisible();
  });

  test("pins and moves the cards with the scroll, then unpins", async ({ page }) => {
    await page.goto("/es");
    await expect(coverflow(page)).toHaveClass(/is-3d/);

    await scrollTravel(page, 0.5);
    expect(await activeDot(page)).toBe(2);
    const sticky = coverflow(page).locator(".cf-sticky");
    expect(await sticky.evaluate((node) => Math.round(node.getBoundingClientRect().top))).toBe(0);
    // The centered card faces the viewer; its neighbours turn about 38°.
    const angles = await cards(page).evaluateAll((items) =>
      items.map((item) => Number((item as HTMLElement).style.transform.match(/rotateY\((-?[\d.e-]+)deg\)/)?.[1])),
    );
    expect(angles[2]).toBeCloseTo(0, 0);
    expect(angles[1]).toBeCloseTo(38, 0);
    expect(angles[3]).toBeCloseTo(-38, 0);
    await expect(page.locator("#case-panel-netplan")).toBeVisible();

    await scrollTravel(page, 1.2);
    expect(await activeDot(page)).toBe(4);
    expect(await sticky.evaluate((node) => node.getBoundingClientRect().top)).toBeLessThan(0);
  });

  test("tabbing into a card link centers it and Enter opens its detail", async ({ page }) => {
    await page.goto("/es");
    const link = page.getByRole("link", { name: /Ver el caso.*Caso 04/ });
    await link.focus();
    // Focusing scrolls (smoothly) until that card is the centered one.
    await expect.poll(() => activeDot(page)).toBe(3);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#case-panel-horebs$/);
    await expect(page.locator("#case-panel-horebs")).toBeVisible();
  });

  test("shows the planned case with dashed nodes and its own labels", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/es");
    await page.getByRole("link", { name: /Ver el caso.*Caso 05/ }).click();
    const panel = page.locator("#case-panel-ai-support-platform");

    await expect(panel.getByText("FLUJO PLANEADO")).toBeVisible();
    await expect(panel.getByText("DECISIONES DE DISEÑO")).toBeVisible();
    await expect(panel.getByText("CÓMO SE VA A MEDIR")).toBeVisible();
    const firstNode = panel.locator("ol").first().locator("li").first();
    await expect(firstNode).toHaveCSS("border-top-style", "dashed");
  });

  test("renders pending data as placeholders", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/es");
    await page.getByRole("link", { name: /Ver el caso.*Caso 03/ }).click();
    const panel = page.locator("#case-panel-netplan");
    await expect(
      panel.getByText("[Añade: para quién es y qué problema concreto le ahorra]"),
    ).toBeVisible();
    await expect(panel.locator("[data-placeholder]").first()).toBeVisible();
  });

  test("reduced motion shows a plain grid: no pinning, no 3D, no dots", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/es");
    await expect(coverflow(page)).not.toHaveClass(/is-3d/);
    await expect(coverflow(page).locator(".cf-stage")).toHaveCSS("display", "grid");
    await expect(coverflow(page).locator(".cf-sticky")).toHaveCSS("position", "static");
    await expect(page.locator(".cf-dot")).toHaveCount(0);
    expect(await cards(page).first().evaluate((item) => (item as HTMLElement).style.transform)).toBe("");
  });
});

test("mobile: one card at a time, no horizontal overflow, vertical flow in the detail", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "mobile layout only");
  await page.goto("/es");
  await scrollTravel(page, 0.25);
  const opacities = await cards(page).evaluateAll((items) => items.map((item) => Number((item as HTMLElement).style.opacity)));
  expect(opacities.filter((value) => value > 0)).toHaveLength(1);
  expect(await activeDot(page)).toBe(1);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  ).toBe(0);
  // The centered card's detail keeps its vertical flow below 640 px.
  await expect(page.locator("#case-panel-superlikers-whatsapp ol").first()).toHaveCSS(
    "flex-direction",
    "column",
  );
});
