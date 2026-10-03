import { expect, test } from "@playwright/test";

test.describe("contact", () => {
  test("shows the three validation messages in order", async ({ page }) => {
    // Client-side validation only: the final valid submission must not reach
    // the real API (it would store a lead in Supabase on every run).
    await page.route("**/api/contact", (route) =>
      route.fulfill({ status: 200, json: { leadId: "00000000-0000-4000-8000-000000000000" } }),
    );
    await page.goto("/es#contacto");
    const form = page.locator("#contacto form");
    const send = form.getByRole("button", { name: "Enviar mensaje" });
    const alert = form.getByRole("alert");

    await send.click();
    await expect(alert).toHaveText(
      "Escribe tu nombre para saber a quién respondo.",
    );
    await expect(form.getByLabel("Nombre")).toBeFocused();
    await expect(form.getByLabel("Nombre")).toHaveAttribute(
      "aria-invalid",
      "true",
    );

    await form.getByLabel("Nombre").fill("Ana");
    await form.getByLabel("Correo").fill("ana@");
    await send.click();
    await expect(alert).toHaveText(
      "Revisa tu correo: así te llega la confirmación.",
    );
    await expect(form.getByLabel("Correo")).toBeFocused();

    await form.getByLabel("Correo").fill("ana@empresa.com");
    await send.click();
    await expect(alert).toHaveText("Cuéntame un poco del problema o la vacante.");
    await expect(form.getByLabel("Mensaje")).toBeFocused();

    await form.getByLabel("Mensaje").fill("Un proceso manual de facturación");
    await send.click();
    await expect(alert).toHaveCount(0);
  });

  test("lets the visitor pick the message type", async ({ page }) => {
    await page.goto("/es#contacto");
    const form = page.locator("#contacto form");
    const project = form.getByRole("button", { name: "Un proyecto" });
    await expect(
      form.getByRole("button", { name: "Una vacante" }),
    ).toHaveAttribute("aria-pressed", "true");
    await project.click();
    await expect(project).toHaveAttribute("aria-pressed", "true");
  });

  test("shows the pipeline waiting and the direct channels", async ({ page }) => {
    await page.goto("/es#contacto");
    const pipeline = page.getByRole("region", {
      name: "Lo que pasa cuando envías",
    });
    await expect(pipeline.getByText("En espera")).toHaveCount(5);
    await expect(pipeline.getByText("$ esperando un mensaje…")).toBeVisible();

    await expect(
      page.getByRole("link", { name: /\+57 318 759 2616/ }),
    ).toHaveAttribute("href", "https://wa.me/573187592616");
    await expect(
      page.getByRole("link", { name: "jorgemaikelsierraamaya@gmail.com" }),
    ).toHaveAttribute("href", "mailto:jorgemaikelsierraamaya@gmail.com");
  });
});
