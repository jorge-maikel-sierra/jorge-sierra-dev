import { expect, test, type Page } from "@playwright/test";

const MUTED = "rgb(138, 144, 153)";
const TEXT = "rgb(236, 237, 239)";

// Experience: a pinned screen with a vertical rail of cards (3 roles, education,
// how I work); scrolling walks down the rail and the detail follows the active
// card, with the closing buttons always in sight.
const root = (page: Page) => page.locator("#trayectoria-stack");
const cardButtons = (page: Page) => page.locator("#trayectoria-stack [data-xp-card] button");
const activeIndex = (page: Page) =>
  cardButtons(page).evaluateAll((buttons) => buttons.findIndex((button) => button.getAttribute("aria-pressed") === "true"));

async function scrollTravel(page: Page, fraction: number) {
  await page.evaluate((f) => {
    const section = document.querySelector<HTMLElement>("#trayectoria-stack")!;
    const sticky = section.firstElementChild as HTMLElement;
    const start = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: start + (section.offsetHeight - sticky.offsetHeight) * f, behavior: "instant" });
  }, fraction);
  await page.waitForTimeout(250);
}

const card = (page: Page, text: string) => page.locator("#trayectoria-stack [data-xp-card]").filter({ hasText: text });

test.describe("experience", () => {
  test("lists the three roles, education and how I work as cards", async ({ page }) => {
    await page.goto("/es");
    await expect(cardButtons(page)).toHaveCount(5);
    for (const [i, text] of ["SOAINT", "IX Colombia", "SENA", "Formación", "Cómo trabajo"].entries()) {
      await expect(cardButtons(page).nth(i)).toContainText(text);
    }
    await expect(page.locator("#exp-panel-soaint")).toBeVisible();
    await expect(page.getByText("Lidero un equipo de 2 a 3 desarrolladores.")).toBeVisible();
  });

  test("pins, walks down the rail with the scroll and the detail follows", async ({ page }) => {
    await page.goto("/es");
    await expect(root(page)).toHaveAttribute("data-pinned", "");
    await scrollTravel(page, 0);
    expect(await root(page).locator("> div").evaluate((n) => Math.round(n.getBoundingClientRect().top))).toBe(0);

    await scrollTravel(page, 0.5);
    expect(await activeIndex(page)).toBe(2);
    await expect(page.locator("#exp-panel-sena")).toBeVisible();
    await expect(page.locator("#exp-panel-soaint")).toBeHidden();

    await scrollTravel(page, 1);
    expect(await activeIndex(page)).toBe(4);
    await expect(page.locator("#exp-panel-principles").getByText("Spec-Driven Development")).toBeVisible();

    await scrollTravel(page, 1.3);
    expect(await root(page).locator("> div").evaluate((n) => n.getBoundingClientRect().top)).toBeLessThan(0);
  });

  test("one click on a card jumps to it", async ({ page }) => {
    await page.goto("/es");
    await scrollTravel(page, 0);
    await cardButtons(page).nth(3).click();
    await expect.poll(() => activeIndex(page)).toBe(3);
    await expect(page.locator("#exp-panel-education").getByText("AWS Cloud Architecture")).toBeVisible();
  });

  test("fits one screen: rail, detail and the buttons, nothing cut off", async ({ page }) => {
    await page.goto("/es");
    await scrollTravel(page, 0.25);
    const viewport = page.viewportSize()!;
    for (const name of [/CV/, /LinkedIn/, /contacto/i]) {
      const link = page.locator("#trayectoria").getByRole("link", { name }).filter({ visible: true }).last();
      const box = await link.boundingBox();
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
    ).toBe(0);
  });

  test("the area filter dims roles with AA colors and highlights chips", async ({ page }) => {
    await page.goto("/es");
    await scrollTravel(page, 0.25);
    const filters = page.getByRole("group", { name: "Filtrar por área" });
    const title = (org: string, text: string) =>
      card(page, org).locator("span", { hasText: new RegExp(`^${text}$`) });

    await filters.getByRole("button", { name: "Frontend" }).click();
    await expect(filters.getByRole("button", { name: "Frontend" })).toHaveAttribute("aria-pressed", "true");
    await expect(title("SOAINT", "Ingeniero de IA & Automatización")).toHaveCSS("color", MUTED);
    await expect(title("IX Colombia", "Desarrollador Full Stack")).toHaveCSS("color", TEXT);
    await expect(page.locator('#exp-panel-ix-colombia [data-chip="frontend"]').first()).toHaveCSS(
      "color",
      "rgb(110, 240, 176)",
    );

    await filters.getByRole("button", { name: "Todo" }).click();
    await expect(title("SOAINT", "Ingeniero de IA & Automatización")).toHaveCSS("color", TEXT);
  });

  test("links to a CV generated for each language and to LinkedIn", async ({ page, request }) => {
    for (const [locale, label] of [
      ["es", "Descargar CV"],
      ["en", "Download CV"],
    ] as const) {
      await page.goto(`/${locale}`);
      const cv = page.locator("#trayectoria").getByRole("link", { name: label });
      const href = `/cv/jorge-sierra-cv-${locale}.pdf`;
      await expect(cv).toHaveAttribute("href", href);
      const response = await request.get(href);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("application/pdf");
    }
    await page.goto("/es");
    await expect(page.locator("#trayectoria").getByRole("link", { name: /LinkedIn/ })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/jorgemaikelsierra/",
    );
  });

  test("reduced motion does not pin: a click just selects", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/es");
    await expect(root(page)).not.toHaveAttribute("data-pinned", "");
    await cardButtons(page).nth(1).click();
    await expect(page.locator("#exp-panel-ix-colombia")).toBeVisible();
  });
});
