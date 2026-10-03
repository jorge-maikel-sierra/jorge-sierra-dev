import { expect, test } from "@playwright/test";

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

  test("the area filter dims roles and highlights chips", async ({ page }) => {
    await page.goto("/es");
    const filters = page.getByRole("group", { name: "Filtrar por área" });

    await filters.getByRole("button", { name: "Frontend" }).click();
    await expect(
      filters.getByRole("button", { name: "Frontend" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(roleCard(page, "SOAINT")).toHaveCSS("opacity", "0.32");
    await expect(roleCard(page, "clínicas")).toHaveCSS("opacity", "1");
    await expect(
      roleCard(page, "clínicas").locator('[data-chip="frontend"]').first(),
    ).toHaveCSS("color", "rgb(110, 240, 176)");

    await filters.getByRole("button", { name: "Todo" }).click();
    await expect(roleCard(page, "SOAINT")).toHaveCSS("opacity", "1");
  });

  test("shows the side cards and a pending CV link as a placeholder", async ({
    page,
  }) => {
    await page.goto("/es");
    await expect(page.getByText("Formación y en curso")).toBeVisible();
    await expect(page.getByText("Cómo trabajo")).toBeVisible();
    await expect(page.getByText("[Enlace al CV en PDF]")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /LinkedIn/ }),
    ).toHaveAttribute("href", "https://www.linkedin.com/in/jorgemaikelsierra/");
  });
});
