import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it, vi } from "vitest";
import { runAgent, type AgentDeps, type TraceData } from "@/lib/ai/agent";
import type { MatchReport } from "@/lib/ai/mode";
import type { RetrievedChunk } from "@/lib/ai/retrieval";
import { loadCases } from "@/lib/content/load";

// Task 4.5: the whole /api/agent flow with simulated models, in all four modes.

const usage = {
  inputTokens: { total: 100, noCache: 100, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 40, text: 40, reasoning: undefined },
};
const finish = { unified: "stop" as const, raw: undefined };

/** Chat model: streams the JSON report when asked for structured output, prose otherwise. */
const chatModel = (deltas: string[], report?: MatchReport) =>
  new MockLanguageModelV4({
    doStream: async ({ responseFormat }) => ({
      stream: simulateReadableStream({
        chunks: [
          { type: "text-start", id: "t1" },
          ...(responseFormat?.type === "json" ? [JSON.stringify(report ?? {})] : deltas).map(
            (delta) => ({ type: "text-delta" as const, id: "t1", delta }),
          ),
          { type: "text-end", id: "t1" },
          { type: "finish", finishReason: finish, usage },
        ],
      }),
    }),
  });

const chunk = (chunkId: number, title: string): RetrievedChunk => ({
  chunkId,
  title,
  url: null,
  sourceType: "case",
  section: "",
  content: `contenido sobre ${title}`,
  score: 0.03,
  similarity: 0.55,
});

function deps(mode: string, chat: MockLanguageModelV4): AgentDeps & { search: ReturnType<typeof vi.fn> } {
  const search = vi.fn(async () => [chunk(11, "Paga Diario"), chunk(12, "Chatbot de WhatsApp")]);
  return {
    search,
    models: {
      chat,
      fast: new MockLanguageModelV4({
        doGenerate: async ({ prompt }) => {
          // Same fast model: classifier first, then requirement extraction.
          const isExtraction = JSON.stringify(prompt).includes("Extrae de la vacante");
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  isExtraction
                    ? { roleTitle: "AI Engineer", requirements: ["n8n", "Node.js"] }
                    : { result: mode },
                ),
              },
            ],
            finishReason: finish,
            usage,
            warnings: [],
          };
        },
      }),
      chatModelId: "claude-sonnet-5-5",
      fastModelId: "claude-haiku-4-5",
    },
    retrieval: { embedQuery: async () => [0.1], search },
    cases: loadCases("es"),
    createLead: async () => "lead-1",
    now: () => 0,
  };
}

async function collect(stream: ReadableStream<unknown>) {
  const reader = stream.getReader();
  const parts: { type: string; delta?: string; data?: unknown }[] = [];
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    parts.push(value as { type: string });
  }
  return {
    text: parts.filter((p) => p.type === "text-delta").map((p) => p.delta).join(""),
    trace: parts.find((p) => p.type === "data-trace")?.data as TraceData | undefined,
    report: parts.find((p) => p.type === "data-report")?.data as MatchReport | undefined,
    types: parts.map((p) => p.type),
  };
}

const visitor = (text: string) => [{ role: "user" as const, text }];

describe("agent flow (mocked models)", () => {
  it("general: answers with valid citations and drops invented ones", async () => {
    const d = deps(
      "general",
      chatModel(["Construyó Paga Diario [fue", "nte:1] y un chatbot [fuente:2]", " en Rust [fuente:9]."]),
    );
    const out = await collect(runAgent({ turns: visitor("¿Qué ha construido?"), deps: d }));

    expect(out.text).toBe("Construyó Paga Diario [fuente:1] y un chatbot [fuente:2] en Rust .");
    expect(out.trace).toMatchObject({ mode: "general", model: "claude-sonnet-5-5", invalidCitations: 1 });
    expect(out.trace?.retrieved.map((s) => s.id)).toEqual([1, 2]);
    expect(out.trace?.steps.map((s) => s.name)).toEqual(["classify", "retrieve", "generate", "verify"]);
    expect(out.trace?.tokens).toEqual({ input: 200, output: 80 });
    expect(out.trace?.costUsd).toBeGreaterThan(0);
    expect(out.report).toBeUndefined();
  });

  it("vacancy: streams a fit report whose evidence only cites real sources", async () => {
    const report: MatchReport = {
      roleTitle: "AI Engineer",
      summary: "Encaja en automatización con n8n.",
      matches: [
        { requirement: "n8n", evidence: "Chatbot con n8n", sourceIds: [2] },
        { requirement: "Kubernetes", evidence: "Inventado", sourceIds: [42] },
      ],
      gaps: [{ requirement: "Kubernetes", note: "No hay evidencia en el perfil." }],
      interviewQuestions: ["¿Cómo versiona sus workflows de n8n?"],
    };
    const d = deps("vacancy", chatModel(["Encaja en n8n [fuente:2]."], report));
    const out = await collect(
      runAgent({ turns: visitor("Buscamos AI Engineer con n8n y Node.js"), deps: d }),
    );

    expect(out.report?.matches).toEqual([
      { requirement: "n8n", evidence: "Chatbot con n8n", sourceIds: [2] },
    ]);
    expect(out.report?.gaps).toHaveLength(1);
    expect(out.trace).toMatchObject({ mode: "vacancy", invalidCitations: 1 });
    // One search per extracted requirement (top 3 each).
    expect(d.search).toHaveBeenCalledTimes(2);
    expect(d.search).toHaveBeenCalledWith(expect.objectContaining({ query: "n8n", matchCount: 3 }));
    // Report and prose ran in parallel: two chat calls, both counted.
    expect(out.trace?.tokens).toEqual({ input: 400, output: 160 });
  });

  it("problem: retrieves for the visitor's description", async () => {
    const d = deps("problem", chatModel(["Lo resolvería con colas [fuente:1]."]));
    const out = await collect(
      runAgent({ turns: visitor("Cobramos préstamos con Excel y cuadernos"), deps: d }),
    );
    expect(out.trace?.mode).toBe("problem");
    expect(d.search).toHaveBeenCalledWith(
      expect.objectContaining({ query: "Cobramos préstamos con Excel y cuadernos" }),
    );
    expect(out.text).toContain("[fuente:1]");
  });

  it("out_of_scope: no retrieval, no sources, polite redirection", async () => {
    const d = deps("out_of_scope", chatModel(["Solo hablo de su perfil profesional. Escríbele desde Contacto."]));
    const out = await collect(runAgent({ turns: visitor("¿Cuánto gana Jorge?"), deps: d }));
    expect(d.search).not.toHaveBeenCalled();
    expect(out.trace).toMatchObject({ mode: "out_of_scope", retrieved: [] });
    expect(out.trace?.steps.map((s) => s.name)).not.toContain("retrieve");
    expect(out.text).toContain("Contacto");
  });

  it("keeps the mode sent back by the client instead of reclassifying", async () => {
    const d = deps("vacancy", chatModel(["Respuesta [fuente:1]."]));
    const out = await collect(
      runAgent({
        turns: [
          { role: "user", text: "Buscamos AI Engineer" },
          { role: "assistant", text: "Encaja." },
          { role: "user", text: "¿Y en Paga Diario qué hizo?" },
        ],
        mode: "general",
        deps: d,
      }),
    );
    expect(out.trace?.mode).toBe("general");
    expect(out.trace?.steps.map((s) => s.name)).not.toContain("classify");
  });

  it("reports the answer's cost once", async () => {
    const onCost = vi.fn();
    const d = { ...deps("general", chatModel(["Hola [fuente:1]."])), onCost };
    await collect(runAgent({ turns: visitor("Hola"), deps: d }));
    expect(onCost).toHaveBeenCalledTimes(1);
    expect(onCost.mock.calls[0][0]).toBeGreaterThan(0);
  });
});
