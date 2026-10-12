import { expect, test, type Page } from "@playwright/test";

const MUTED = "rgb(138, 144, 153)";
const TEXT = "rgb(236, 237, 239)";

// Experience: one screen with a role picker next to the selected role's detail.
const picker = (page: Page, org: string) => page.locator("li[data-role]").filter({ hasText: org });
const section = (page: Page) => page.locator("#trayectoria");

test.describe("experience", () => {
  test("shows the roles and the current one's detail, then another on click", async ({ page }) => {
    await page.goto("/es");
    await expect(page.locator("li[data-role]")).toHaveCount(3);
    await expect(picker(page, "SOAINT").getByText("Actual")).toBeVisible();
    await expect(page.getByText("Lidero un equipo de 2 a 3 desarrolladores.")).toBeVisible();

    await picker(page, "IX Colombia").getByRole("button").click();
    await expect(picker(page, "IX Colombia").getByRole("button")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#exp-role-ix-colombia")).toBeVisible();
    await expect(page.locator("#exp-role-soaint")).toBeHidden();
  });

  test("fits one screen: no page-level overflow, buttons inside the viewport", async ({ page }) => {
    await page.goto("/es");
    await section(page).scrollIntoViewIfNeeded();
    const box = await section(page).evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return { height: Math.round(rect.height), viewport: window.innerHeight };
    });
    expect(box.height).toBeLessThanOrEqual(Math.max(box.viewport, 600));
    const viewport = page.viewportSize()!;
    for (const name of [/CV/, /LinkedIn/, /contacto|contact/i]) {
      const link = section(page).getByRole("link", { name }).filter({ visible: true }).last();
      await expect(link).toBeInViewport();
      const rect = await link.boundingBox();
      expect(rect!.x + rect!.width).toBeLessThanOrEqual(viewport.width);
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
    ).toBe(0);
  });

  test("the area filter dims roles with AA colors and highlights chips", async ({ page }) => {
    await page.goto("/es");
    const filters = page.getByRole("group", { name: "Filtrar por área" });
    const title = (org: string, text: string) =>
      picker(page, org).locator("span", { hasText: new RegExp(`^${text}$`) });

    await filters.getByRole("button", { name: "Frontend" }).click();
    await expect(filters.getByRole("button", { name: "Frontend" })).toHaveAttribute("aria-pressed", "true");
    await expect(title("SOAINT", "Ingeniero de IA & Automatización")).toHaveCSS("color", MUTED);
    await expect(title("IX Colombia", "Desarrollador Full Stack")).toHaveCSS("color", TEXT);

    await picker(page, "IX Colombia").getByRole("button").click();
    await expect(page.locator('#exp-role-ix-colombia [data-chip="frontend"]').first()).toHaveCSS(
      "color",
      "rgb(110, 240, 176)",
    );

    await filters.getByRole("button", { name: "Todo" }).click();
    await expect(title("SOAINT", "Ingeniero de IA & Automatización")).toHaveCSS("color", TEXT);
  });

  test("education and how I work live in their own views, the buttons stay in sight", async ({ page }) => {
    await page.goto("/es");
    await section(page).scrollIntoViewIfNeeded();
    await page.getByRole("tab", { name: "Formación" }).click();
    const views = section(page).getByRole("tabpanel");
    await expect(views.getByText("Formación y en curso")).toBeVisible();
    await expect(views.getByText("AWS Cloud Architecture")).toBeVisible();
    await expect(page.getByText("Lidero un equipo de 2 a 3 desarrolladores.")).toBeHidden();
    await page.getByRole("tab", { name: "Cómo trabajo" }).click();
    await expect(views.getByText("Spec-Driven Development")).toBeVisible();
    await expect(section(page).getByRole("link", { name: /LinkedIn/ })).toBeInViewport();
    await page.getByRole("tab", { name: "Experiencia" }).click();
    await expect(page.locator("#exp-role-soaint")).toBeVisible();
  });

  test("links to a CV generated for each language and to LinkedIn", async ({ page, request }) => {
    for (const [locale, label] of [
      ["es", "Descargar CV"],
      ["en", "Download CV"],
    ] as const) {
      await page.goto(`/${locale}`);
      const cv = section(page).getByRole("link", { name: label });
      const href = `/cv/jorge-sierra-cv-${locale}.pdf`;
      await expect(cv).toHaveAttribute("href", href);
      const response = await request.get(href);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("application/pdf");
    }
    await page.goto("/es");
    await expect(section(page).getByRole("link", { name: /LinkedIn/ })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/jorgemaikelsierra/",
    );
  });
});
