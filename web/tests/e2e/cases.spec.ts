import { expect, test } from "@playwright/test";

const selector = (page: import("@playwright/test").Page) =>
  page.getByRole("group", { name: "Elige un caso de estudio" });

test.describe("case studies", () => {
  test("lists the five cases in file order with the first one selected", async ({
    page,
  }) => {
    await page.goto("/es");
    const cards = selector(page).getByRole("button");
    await expect(cards).toHaveCount(5);
    await expect(cards.first()).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("heading", {
        level: 3,
        name: "Del cuaderno y el Excel a una plataforma de cobro en tiempo real",
      }),
    ).toBeVisible();
  });

  test("moves between cases with the keyboard", async ({ page }) => {
    await page.goto("/es");
    const cards = selector(page).getByRole("button");

    await cards.first().focus();
    await page.keyboard.press("ArrowRight");
    await expect(cards.nth(1)).toBeFocused();
    await expect(cards.nth(1)).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("heading", {
        level: 3,
        name: "Un agente que lee tickets de compra y asigna puntos solo",
      }),
    ).toBeVisible();

    await page.keyboard.press("End");
    await expect(cards.nth(4)).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(cards.first()).toBeFocused();
  });

  test("shows the planned case with dashed nodes and its own labels", async ({
    page,
  }) => {
    await page.goto("/es");
    await selector(page).getByRole("button").nth(4).click();
    const panel = page.locator("#case-panel-ai-support-platform");

    await expect(panel.getByText("FLUJO PLANEADO")).toBeVisible();
    await expect(panel.getByText("DECISIONES DE DISEÑO")).toBeVisible();
    await expect(panel.getByText("CÓMO SE VA A MEDIR")).toBeVisible();

    const firstNode = panel.locator("ol").first().locator("li").first();
    await expect(firstNode).toHaveCSS("border-top-style", "dashed");
  });

  test("renders pending data as placeholders", async ({ page }) => {
    await page.goto("/es");
    await selector(page).getByRole("button").nth(2).click();
    const panel = page.locator("#case-panel-netplan");
    await expect(
      panel.getByText("[DEMO: enlace o GIF del mapa calculando la red]"),
    ).toBeVisible();
    await expect(panel.locator("[data-placeholder]").first()).toBeVisible();
  });
});

test("mobile shows a horizontal carousel and a vertical flow", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "mobile layout only");
  await page.goto("/es");
  const strip = selector(page);
  await expect(strip).toHaveCSS("overflow-x", "auto");
  expect(
    await strip.evaluate((node) => node.scrollWidth > node.clientWidth),
  ).toBe(true);

  const flow = page.locator("#case-panel-paga-diario ol").first();
  await expect(flow).toHaveCSS("flex-direction", "column");

  await page.getByRole("button", { name: "Caso siguiente" }).click();
  await expect(page.getByText("2 / 5")).toBeVisible();
});
