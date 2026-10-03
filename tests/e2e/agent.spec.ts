import AxeBuilder from "@axe-core/playwright";
import { createUIMessageStreamResponse, simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { expect, test, type Page } from "@playwright/test";
import { runAgent } from "@/lib/ai/agent";
import type { MatchReport } from "@/lib/ai/mode";
import type { RetrievedChunk } from "@/lib/ai/retrieval";
import { loadCases } from "@/lib/content/load";

// Task 4.6. The /api/agent stream is produced by the real runAgent with mocked
// models, so the UI is tested against the exact protocol the server sends.

const usage = {
  inputTokens: { total: 120, noCache: 120, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 60, text: 60, reasoning: undefined },
};
const finish = { unified: "stop" as const, raw: undefined };

const report: MatchReport = {
  roleTitle: "AI Engineer — Automatización",
  summary: "Encaja en automatización con n8n y agentes; no hay evidencia de Kubernetes.",
  matches: [
    { requirement: "n8n y agentes con LLM", evidence: "Chatbot de WhatsApp con GPT-4o Vision", sourceIds: [2] },
  ],
  gaps: [{ requirement: "Kubernetes", note: "No hay evidencia en el perfil." }],
  interviewQuestions: ["¿Cómo versiona y prueba sus workflows de n8n?"],
};

const chunk = (chunkId: number, title: string, url: string): RetrievedChunk => ({
  chunkId,
  title,
  url,
  sourceType: "case",
  section: "",
  content: `contenido sobre ${title}`,
  score: 0.03,
  similarity: 0.55,
});

async function agentStream(mode: string, text: string) {
  const fast = new MockLanguageModelV4({
    doGenerate: async ({ prompt }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(
            JSON.stringify(prompt).includes("Extrae de la vacante")
              ? { roleTitle: report.roleTitle, requirements: ["n8n", "Kubernetes"] }
              : { result: mode },
          ),
        },
      ],
      finishReason: finish,
      usage,
      warnings: [],
    }),
  });
  const chat = new MockLanguageModelV4({
    // Structured output (the fit report) is requested with a JSON response format.
    doStream: async ({ responseFormat }) => ({
      stream: simulateReadableStream({
        chunks: [
          { type: "text-start", id: "t" },
          {
            type: "text-delta",
            id: "t",
            delta: responseFormat?.type === "json" ? JSON.stringify(report) : text,
          },
          { type: "text-end", id: "t" },
          { type: "finish", finishReason: finish, usage },
        ],
      }),
    }),
  });

  const response = createUIMessageStreamResponse({
    stream: runAgent({
      turns: [{ role: "user", text: "x" }],
      deps: {
        models: { chat, fast, chatModelId: "claude-sonnet-5-5", fastModelId: "claude-haiku-4-5" },
        retrieval: {
          embedQuery: async () => [0],
          search: async () => [
            chunk(1, "Paga Diario", "https://jorge-sierra.dev/es#casos"),
            chunk(2, "Chatbot de WhatsApp con visión", "https://github.com/jorge-maikel-sierra/superlikers-ai-automation-challenge"),
          ],
        },
        cases: loadCases("es"),
        createLead: async () => "lead",
      },
    }),
  });
  return { body: await response.text(), headers: Object.fromEntries(response.headers) };
}

async function ask(page: Page, text: string) {
  await page.goto("/es");
  await page.getByLabel("Pregúntale a mi agente").fill(text);
  await page.getByRole("button", { name: "Analizar" }).click();
}

test.describe("agent", () => {
  test("paste a vacancy → fit report with linked sources", async ({ page }) => {
    const { body, headers } = await agentStream(
      "vacancy",
      "Encaja en automatización con n8n [fuente:2]. Si quieres, agenda una llamada.",
    );
    await page.route("**/api/agent", (route) => route.fulfill({ status: 200, headers, body }));
    await ask(page, "Buscamos AI Engineer con n8n, agentes y Kubernetes");

    const reportRegion = page.getByRole("region", { name: "Encaje con la vacante" });
    await expect(reportRegion).toBeVisible();
    await expect(reportRegion.getByText("n8n y agentes con LLM")).toBeVisible();
    await expect(reportRegion.getByText("Kubernetes", { exact: true })).toBeVisible();
    await expect(reportRegion.getByRole("link", { name: "[2]" })).toHaveAttribute(
      "href",
      "https://github.com/jorge-maikel-sierra/superlikers-ai-automation-challenge",
    );

    // Citations in the prose link to their source; the panel stays collapsed.
    await expect(page.locator("#agente sup a", { hasText: "[2]" })).toHaveAttribute(
      "href",
      /superlikers/,
    );
    const panel = page.locator("#agente details");
    await expect(panel).not.toHaveAttribute("open", "");
    await page.locator("#agente summary").focus();
    await page.keyboard.press("Enter");
    await expect(panel.getByText("Vacante")).toBeVisible();
    await expect(panel.getByText("claude-sonnet-5-5")).toBeVisible();
  });

  test("the report, citations and trace panel have no serious a11y violations", async ({
    page,
  }) => {
    const { body, headers } = await agentStream("vacancy", "Encaja en n8n [fuente:2].");
    await page.route("**/api/agent", (route) => route.fulfill({ status: 200, headers, body }));
    await ask(page, "Buscamos AI Engineer con n8n");
    await expect(page.getByRole("region", { name: "Encaje con la vacante" })).toBeVisible();
    await page.locator("#agente summary").click();
    const { violations } = await new AxeBuilder({ page })
      .include("#agente")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      violations
        .filter((v) => v.impact === "serious" || v.impact === "critical")
        .map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target.join(" ")) })),
    ).toEqual([]);
  });

  test("out of scope → polite redirection without sources", async ({ page }) => {
    const { body, headers } = await agentStream(
      "out_of_scope",
      "Solo hablo de su perfil profesional. Para eso, escríbele desde Contacto.",
    );
    await page.route("**/api/agent", (route) => route.fulfill({ status: 200, headers, body }));
    await ask(page, "¿Cuánto cobra Jorge?");
    await expect(page.getByText("Solo hablo de su perfil profesional.")).toBeVisible();
    await expect(page.locator("#agente").getByText("Fuentes", { exact: true })).toHaveCount(0);
  });

  test("rate limit shows the wait time", async ({ page }) => {
    await page.route("**/api/agent", (route) =>
      route.fulfill({ status: 429, json: { error: "rate_limited", retryAfter: 240 } }),
    );
    await ask(page, "Hola");
    await expect(page.locator("#agente").getByRole("alert")).toHaveText(
      "Hiciste varias preguntas seguidas. Vuelve a intentarlo en 4 min.",
    );
  });

  test("an exhausted budget points to the contact form", async ({ page }) => {
    await page.route("**/api/agent", (route) =>
      route.fulfill({ status: 503, json: { error: "budget" } }),
    );
    await ask(page, "Hola");
    const alert = page.locator("#agente").getByRole("alert");
    await expect(alert).toContainText("El agente descansa por hoy.");
    await expect(alert.getByRole("link", { name: "Ir a contacto" })).toHaveAttribute(
      "href",
      "#contacto",
    );
  });

  test("works with the keyboard alone", async ({ page }) => {
    const { body, headers } = await agentStream("general", "Construyó Paga Diario [fuente:1].");
    await page.route("**/api/agent", (route) => route.fulfill({ status: 200, headers, body }));
    await page.goto("/es");
    await page.getByLabel("Pregúntale a mi agente").focus();
    await page.keyboard.type("¿Qué construyó?");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Construyó Paga Diario")).toBeVisible();
    await expect(page.getByLabel("Pregúntale a mi agente")).toHaveAttribute(
      "placeholder",
      "Haz otra pregunta sobre su perfil…",
    );
  });
});
