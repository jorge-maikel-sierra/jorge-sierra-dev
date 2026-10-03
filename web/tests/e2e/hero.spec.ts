import { expect, test } from "@playwright/test";

test.describe("hero", () => {
  test("renders the copy from content/es/profile.json", async ({ page }) => {
    await page.goto("/es");
    await expect(
      page.getByRole("heading", { level: 1, name: "Del caos a la arquitectura." }),
    ).toBeVisible();
    await expect(page.getByText("Disponible para nuevos retos")).toBeVisible();
    await expect(
      page.getByText("n8n · LangChain · RAG · NestJS · Next.js · Supabase"),
    ).toBeVisible();
  });

  test("shows the agent box and the calls to action", async ({ page }) => {
    await page.goto("/es");
    await expect(page.getByLabel("Pregúntale a mi agente")).toBeVisible();
    await expect(page.getByRole("button", { name: "Analizar" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Ver casos de estudio" }),
    ).toHaveAttribute("href", "#casos");
    await expect(
      page.getByRole("link", { name: "Agendar consulta" }),
    ).toHaveAttribute("href", "#contacto");
  });

  test("is readable without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/es");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByLabel("Pregúntale a mi agente")).toBeVisible();
    await context.close();
  });
});

test("mobile shows the layer flow under the scene strip", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "mobile layout only");
  await page.goto("/es");
  await expect(
    page.getByText("INPUTS → ORQUESTACIÓN → AGENTES IA → APIs → DATOS"),
  ).toBeVisible();
});
