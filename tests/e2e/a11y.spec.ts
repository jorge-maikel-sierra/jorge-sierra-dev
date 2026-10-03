import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// RNF-6 / task 1.8: zero serious or critical violations, desktop and mobile.
const SECTIONS = [
  { name: "hero", selector: "section[aria-labelledby='hero-title']" },
  { name: "casos", selector: "#casos" },
  { name: "trayectoria", selector: "#trayectoria" },
  { name: "contacto", selector: "#contacto" },
];

async function seriousViolations(page: Page, include?: string) {
  let builder = new AxeBuilder({ page }).withTags([
    "wcag2a",
    "wcag2aa",
    "wcag21a",
    "wcag21aa",
  ]);
  if (include) builder = builder.include(include);
  const { violations } = await builder.analyze();
  return violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => n.target.join(" ")),
    }));
}

test.describe("accessibility", () => {
  for (const section of SECTIONS) {
    test(`${section.name} has no serious violations`, async ({ page }) => {
      await page.goto("/es");
      await page.locator(section.selector).scrollIntoViewIfNeeded();
      expect(await seriousViolations(page, section.selector)).toEqual([]);
    });
  }

  test("header and navigation have no serious violations", async ({
    page,
    isMobile,
  }) => {
    await page.goto("/es");
    if (isMobile) await page.getByRole("button", { name: "Menú" }).click();
    expect(await seriousViolations(page, "header")).toEqual([]);
  });

  test("interactive states have no serious violations", async ({ page }) => {
    await page.goto("/es");

    await page
      .getByRole("group", { name: "Elige un caso de estudio" })
      .getByRole("button")
      .nth(4)
      .click();
    await page
      .getByRole("group", { name: "Filtrar por área" })
      .getByRole("button", { name: "Frontend" })
      .click();
    await page
      .locator("#contacto form")
      .getByRole("button", { name: "Enviar mensaje" })
      .click();
    // Let the 300 ms opacity transition of the filtered timeline settle.
    await page.waitForTimeout(400);

    expect(await seriousViolations(page)).toEqual([]);
  });
});
