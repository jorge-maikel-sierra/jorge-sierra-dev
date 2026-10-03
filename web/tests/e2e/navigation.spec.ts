import { expect, test } from "@playwright/test";

const sections = ["Casos", "Agente", "Trayectoria", "Contacto"];

test("root redirects to the Spanish home", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/es$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
});

test.describe("desktop", () => {
  test.skip(({ isMobile }) => isMobile, "desktop layout only");

  test("shows the inline navigation and an inactive language switch", async ({
    page,
  }) => {
    await page.goto("/es");
    const nav = page.getByRole("navigation", { name: "Principal" });
    for (const label of sections) {
      await expect(nav.getByRole("link", { name: label })).toBeVisible();
    }
    await expect(nav.getByText("ES / EN")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await expect(page.getByRole("button", { name: "Menú" })).toBeHidden();
  });
});

test.describe("mobile", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile layout only");

  test("opens, closes with Escape and closes after choosing a link", async ({
    page,
  }) => {
    await page.goto("/es");
    const button = page.getByRole("button", { name: "Menú" });
    const menu = page.getByRole("navigation", { name: "Principal" });

    await expect(menu).toBeHidden();
    await expect(button).toHaveAttribute("aria-expanded", "false");

    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    for (const label of sections) {
      await expect(menu.getByRole("link", { name: label })).toBeVisible();
    }

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(button).toBeFocused();

    await button.click();
    await menu.getByRole("link", { name: "Trayectoria" }).click();
    await expect(page).toHaveURL(/#trayectoria$/);
    await expect(menu).toBeHidden();
  });
});
