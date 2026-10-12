import { expect, test, type Page } from "@playwright/test";

// Case studies: a pinned 3D coverflow with the whole detail on the same screen
// (columns when the screen is wide and tall enough, tabs otherwise). Without
// motion it is a plain grid followed by the detail.

const coverflow = (page: Page) => page.locator("[data-coverflow]");
const cardButtons = (page: Page) => page.locator("[data-cf-item] button");
const activeDot = (page: Page) =>
  page.locator(".cf-dot").evaluateAll((dots) => dots.findIndex((dot) => dot.classList.contains("is-active")));

/** Scrolls to a fraction (0–1) of the pinned travel and lets the frame render. */
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

/** On screens that use tabs, opens the one that holds the wanted section. */
async function openTab(page: Page, name: string) {
  const tab = page.getByRole("tab", { name });
  if (await tab.first().isVisible()) await tab.first().click();
}

const visibleDetail = (page: Page) => page.locator("[id^=case-panel-]:not([hidden])");

test.describe("case studies", () => {
  test("lists the five cases in file order, all the same height", async ({ page }) => {
    await page.goto("/es");
    await expect(cardButtons(page)).toHaveCount(5);
    for (const [i, title] of [
      "Paga Diario",
      "Chatbot de WhatsApp con visión",
      "NetPlan",
      "Pizzería Horebs",
      "AI Support Automation Platform",
    ].entries()) {
      await expect(cardButtons(page).nth(i)).toContainText(title);
    }
    const heights = await page
      .locator("[data-cf-item]")
      .evaluateAll((items) => items.map((item) => (item as HTMLElement).offsetHeight));
    expect(new Set(heights).size).toBe(1);
    await expect(page.locator("#case-panel-paga-diario")).toBeVisible();
  });

  test("pins and moves the cards with the scroll, the detail follows, then unpins", async ({ page }) => {
    await page.goto("/es");
    await expect(coverflow(page)).toHaveClass(/is-3d/);

    await scrollTravel(page, 0.5);
    expect(await activeDot(page)).toBe(2);
    const sticky = coverflow(page).locator(".cf-sticky");
    expect(await sticky.evaluate((node) => Math.round(node.getBoundingClientRect().top))).toBe(0);
    // The centered card faces the viewer; its neighbours turn about 38°.
    const angles = await page.locator("[data-cf-item]").evaluateAll((items) =>
      items.map((item) => Number((item as HTMLElement).style.transform.match(/rotateY\((-?[\d.e-]+)deg\)/)?.[1])),
    );
    expect(angles[2]).toBeCloseTo(0, 0);
    expect(angles[1]).toBeCloseTo(38, 0);
    expect(angles[3]).toBeCloseTo(-38, 0);
    await expect(page.locator("#case-panel-netplan")).toBeVisible();
    await expect(cardButtons(page).nth(2)).toHaveAttribute("aria-pressed", "true");

    await scrollTravel(page, 1.2);
    expect(await activeDot(page)).toBe(4);
    expect(await sticky.evaluate((node) => node.getBoundingClientRect().top)).toBeLessThan(0);
  });

  test("one click on a side card brings its case forward", async ({ page, isMobile }) => {
    // On phones the side cards fade out completely: there the scroll moves them.
    test.skip(isMobile, "desktop only");
    await page.goto("/es");
    await scrollTravel(page, 0);
    await cardButtons(page).nth(1).click();
    await expect.poll(() => activeDot(page)).toBe(1);
    await expect(page.locator("#case-panel-superlikers-whatsapp")).toBeVisible();
  });

  test("focusing a card with the keyboard centers it and shows its detail", async ({ page }) => {
    await page.goto("/es");
    await cardButtons(page).nth(3).focus();
    // Focusing scrolls until that card is the centered one.
    await expect.poll(() => activeDot(page)).toBe(3);
    await page.keyboard.press("Enter");
    await expect(page.locator("#case-panel-horebs")).toBeVisible();
    await expect(cardButtons(page).nth(3)).toHaveAttribute("aria-pressed", "true");
  });

  test("fits one screen: cards, detail and the closing buttons, nothing cut off", async ({ page }) => {
    await page.goto("/es");
    await scrollTravel(page, 0.5);
    await expect(visibleDetail(page)).toBeVisible();
    // The detail scroller has no hidden overflow in the layout the screen gets.
    const overflow = await visibleDetail(page).evaluate((panel) => {
      const scroller = panel.parentElement!;
      return scroller.scrollHeight - scroller.clientHeight;
    });
    expect(overflow).toBeLessThanOrEqual(2);
    const viewport = page.viewportSize()!;
    for (const name of ["Pregúntale a mi agente", "Ver GitHub"]) {
      const link = page.getByRole("link", { name: new RegExp(name) }).filter({ visible: true }).last();
      const box = await link.boundingBox();
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
    }
  });

  test("shows the planned case with dashed nodes and its own labels", async ({ page }) => {
    await page.goto("/es");
    await scrollTravel(page, 1);
    const panel = page.locator("#case-panel-ai-support-platform");
    await expect(panel).toBeVisible();
    await expect(panel.getByText("FLUJO PLANEADO")).toBeVisible();
    await openTab(page, "Decisiones");
    await expect(panel.getByText("DECISIONES DE DISEÑO")).toBeVisible();
    await openTab(page, "Resultado");
    await expect(panel.getByText("CÓMO SE VA A MEDIR")).toBeVisible();
    await openTab(page, "Flujo");
    const firstNode = panel.locator("ol").first().locator("li").first();
    await expect(firstNode).toHaveCSS("border-top-style", "dashed");
  });

  test("renders pending data as placeholders", async ({ page }) => {
    await page.goto("/es");
    await scrollTravel(page, 0.5);
    const panel = page.locator("#case-panel-netplan");
    await expect(panel).toBeVisible();
    await openTab(page, "Problema");
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
    expect(await page.locator("[data-cf-item]").first().evaluate((item) => (item as HTMLElement).style.transform)).toBe("");
    // A card still opens its case, and the detail is brought into view.
    await cardButtons(page).nth(2).click();
    await expect(page.locator("#case-panel-netplan")).toBeVisible();
    await expect(page.locator("#case-panel-netplan")).toBeInViewport();
  });
});

test("mobile: one card at a time, no horizontal overflow, tabs in the detail", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "mobile layout only");
  await page.goto("/es");
  await scrollTravel(page, 0.25);
  const opacities = await page
    .locator("[data-cf-item]")
    .evaluateAll((items) => items.map((item) => Number((item as HTMLElement).style.opacity)));
  expect(opacities.filter((value) => value > 0)).toHaveLength(1);
  expect(await activeDot(page)).toBe(1);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  ).toBe(0);

  const tabs = page.locator("#casos").getByRole("tab");
  await expect(tabs).toHaveCount(4);
  await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
  await tabs.nth(2).click();
  await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#case-panel-superlikers-whatsapp").getByText("Máquina de estados explícita")).toBeVisible();
  await tabs.first().click();
  // The centered card's flow keeps its vertical layout below 820 px.
  await expect(page.locator("#case-panel-superlikers-whatsapp ol").first()).toHaveCSS("flex-direction", "column");
});
