import { expect, test, type Page } from "@playwright/test";

const MUTED = "rgb(138, 144, 153)";
const TEXT = "rgb(236, 237, 239)";

// Experience: a pinned 3D coverflow (3 roles, education, how I work) with the
// detail of the centered card below and the closing buttons always in sight.
const root = (page: Page) => page.locator("#trayectoria-coverflow");
const cards = (page: Page) => page.locator("#trayectoria-coverflow [data-cf-item]");
const cardButtons = (page: Page) => page.locator("#trayectoria-coverflow [data-cf-item] button");
const activeDot = (page: Page) =>
  page.locator("#trayectoria-coverflow .cf-dot").evaluateAll((dots) => dots.findIndex((dot) => dot.classList.contains("is-active")));

async function scrollTravel(page: Page, fraction: number) {
  await page.evaluate((f) => {
    const section = document.querySelector<HTMLElement>("#trayectoria-coverflow")!;
    const sticky = section.querySelector<HTMLElement>(".cf-sticky")!;
    const start = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: start + (section.offsetHeight - sticky.offsetHeight) * f, behavior: "instant" });
  }, fraction);
  await page.waitForTimeout(250);
}

const picker = (page: Page, org: string) => cards(page).filter({ hasText: org });

test.describe("experience", () => {
  test("lists the three roles, education and how I work as cards", async ({ page }) => {
    await page.goto("/es");
    await expect(cardButtons(page)).toHaveCount(5);
    for (const [i, text] of ["SOAINT", "IX Colombia", "SENA", "Formación", "Cómo trabajo"].entries()) {
      await expect(cardButtons(page).nth(i)).toContainText(text);
    }
    await expect(picker(page, "SOAINT").getByText("Actual")).toBeVisible();
    const heights = await cards(page).evaluateAll((items) => items.map((item) => (item as HTMLElement).offsetHeight));
    expect(new Set(heights).size).toBe(1);
  });

  test("pins, moves the cards with the scroll and the detail follows", async ({ page }) => {
    await page.goto("/es");
    await expect(root(page)).toHaveClass(/is-3d/);
    await scrollTravel(page, 0);
    await expect(page.locator("#exp-panel-soaint")).toBeVisible();
    await expect(page.getByText("Lidero un equipo de 2 a 3 desarrolladores.")).toBeVisible();
    expect(await root(page).locator(".cf-sticky").evaluate((n) => Math.round(n.getBoundingClientRect().top))).toBe(0);

    await scrollTravel(page, 0.5);
    expect(await activeDot(page)).toBe(2);
    await expect(page.locator("#exp-panel-sena")).toBeVisible();
    await expect(page.locator("#exp-panel-soaint")).toBeHidden();

    await scrollTravel(page, 1);
    expect(await activeDot(page)).toBe(4);
    await expect(page.locator("#exp-panel-principles").getByText("Spec-Driven Development")).toBeVisible();

    await scrollTravel(page, 1.3);
    expect(await root(page).locator(".cf-sticky").evaluate((n) => n.getBoundingClientRect().top)).toBeLessThan(0);
  });

  test("one click on a side card brings it forward", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop only");
    await page.goto("/es");
    await scrollTravel(page, 0);
    await cardButtons(page).nth(1).click();
    await expect.poll(() => activeDot(page)).toBe(1);
    await expect(page.locator("#exp-panel-ix-colombia")).toBeVisible();
  });

  test("fits one screen: cards, detail and the buttons, nothing cut off", async ({ page }) => {
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
      picker(page, org).locator("span", { hasText: new RegExp(`^${text}$`) });

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

  test("reduced motion shows a plain grid: no pinning, no 3D", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/es");
    await expect(root(page)).not.toHaveClass(/is-3d/);
    await expect(root(page).locator(".cf-sticky")).toHaveCSS("position", "static");
    await cardButtons(page).nth(1).click();
    await expect(page.locator("#exp-panel-ix-colombia")).toBeVisible();
  });
});
