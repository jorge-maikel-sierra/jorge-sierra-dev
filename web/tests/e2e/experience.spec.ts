import { expect, test } from "@playwright/test";

const MUTED = "rgb(138, 144, 153)";
const TEXT = "rgb(236, 237, 239)";

const roleCard = (page: import("@playwright/test").Page, org: string) =>
  page.locator("[data-role]").filter({ hasText: org });

test.describe("experience", () => {
  test("renders the timeline with the current role highlighted", async ({
    page,
  }) => {
    await page.goto("/es");
    await expect(page.locator("[data-role]")).toHaveCount(4);
    const current = roleCard(page, "SOAINT");
    await expect(current.getByText("Actual")).toBeVisible();
    await expect(current.locator("[data-placeholder]").first()).toBeVisible();
  });

  test("the area filter dims roles with AA colors and highlights chips", async ({
    page,
  }) => {
    await page.goto("/es");
    const filters = page.getByRole("group", { name: "Filtrar por área" });

    await filters.getByRole("button", { name: "Frontend" }).click();
    await expect(
      filters.getByRole("button", { name: "Frontend" }),
    ).toHaveAttribute("aria-pressed", "true");
    const title = (org: string) => roleCard(page, org).getByRole("heading");
    await expect(title("SOAINT")).toHaveCSS("color", MUTED);
    await expect(title("clínicas")).toHaveCSS("color", TEXT);
    await expect(
      roleCard(page, "clínicas").locator('[data-chip="frontend"]').first(),
    ).toHaveCSS("color", "rgb(110, 240, 176)");

    await filters.getByRole("button", { name: "Todo" }).click();
    await expect(title("SOAINT")).toHaveCSS("color", TEXT);
  });

  test("shows the side cards and a pending CV link as a placeholder", async ({
    page,
  }) => {
    await page.goto("/es");
    await expect(page.getByText("Formación y en curso")).toBeVisible();
    await expect(page.getByText("Cómo trabajo")).toBeVisible();
    await expect(page.getByText("[Enlace al CV en PDF]")).toBeVisible();
    await expect(
      page.locator("#trayectoria").getByRole("link", { name: /LinkedIn/ }),
    ).toHaveAttribute("href", "https://www.linkedin.com/in/jorgemaikelsierra/");
  });
});
