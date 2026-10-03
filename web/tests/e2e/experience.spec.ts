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
    await expect(page.locator("[data-role]")).toHaveCount(3);
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
    await expect(title("IX Colombia")).toHaveCSS("color", TEXT);
    await expect(
      roleCard(page, "IX Colombia").locator('[data-chip="frontend"]').first(),
    ).toHaveCSS("color", "rgb(110, 240, 176)");

    await filters.getByRole("button", { name: "Todo" }).click();
    await expect(title("SOAINT")).toHaveCSS("color", TEXT);
  });

  test("shows the side cards and a CV generated for each language", async ({
    page,
    request,
  }) => {
    await page.goto("/es");
    await expect(page.getByText("Formación y en curso")).toBeVisible();
    await expect(page.getByText("Cómo trabajo")).toBeVisible();
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
    await expect(
      page.locator("#trayectoria").getByRole("link", { name: /LinkedIn/ }),
    ).toHaveAttribute("href", "https://www.linkedin.com/in/jorgemaikelsierra/");
  });
});
