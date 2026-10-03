import { expect, test } from "@playwright/test";

const sections = ["Casos", "Agente", "Trayectoria", "Contacto"];

// docs/design.md §7: "/" is negotiated from Accept-Language.
// Chromium derives Accept-Language from the context locale.
for (const [browserLocale, locale] of [
  ["es-CO", "es"],
  ["en-US", "en"],
  ["fr-FR", "es"],
] as const) {
  test(`root sends a ${browserLocale} browser to /${locale}`, async ({ browser }) => {
    const context = await browser.newContext({ locale: browserLocale });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page).toHaveURL(new RegExp(`/${locale}$`));
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await context.close();
  });
}

test.describe("desktop", () => {
  test.skip(({ isMobile }) => isMobile, "desktop layout only");

  test("shows the inline navigation and a working language switch", async ({
    page,
  }) => {
    await page.goto("/es");
    const nav = page.getByRole("navigation", { name: "Principal" });
    for (const label of sections) {
      await expect(nav.getByRole("link", { name: label })).toBeVisible();
    }
    await expect(page.getByRole("button", { name: "Menú" })).toBeHidden();

    await nav.getByRole("link", { name: "Read this site in English" }).click();
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(
      page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Ver el sitio en español" }),
    ).toHaveAttribute("href", "/es");
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
