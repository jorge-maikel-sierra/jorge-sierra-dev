import {
  createUIMessageStream,
  generateText,
  isStepCount,
  Output,
  streamText,
  toUIMessageStream,
  type LanguageModel,
  type LanguageModelUsage,
  type ModelMessage,
  type UIMessage,
  type UIMessageStreamWriter,
} from "ai";
import type { Case } from "@/lib/content/schema";
import { estimateCost, type Usage } from "./cost";
import { propagateAttributes, startActiveObservation } from "@langfuse/tracing";
import { citationTransform, type ChatTurn } from "./guardrails";
import {
  AGENT_MODES,
  classifyMode,
  extractRequirements,
  MatchReportSchema,
  type AgentMode,
  type MatchReport,
} from "./mode";
import { buildSystemPrompt, wrapVisitorInput } from "./prompts";
import {
  retrieve,
  retrieveForRequirements,
  type RetrievalDeps,
  type Source,
} from "./retrieval";
import { createAgentTools, SourceRegistry, type AgentToolDeps } from "./tools";

// docs/agent-spec.md §3: guards (in the route) → classify → retrieve →
// generate (stream + tools) → verify citations → trace.

export const MAX_TOOL_STEPS = 5;
export const MAX_OUTPUT_TOKENS = 1200;
export const LLM_TIMEOUT_MS = 20_000;

/** §14: what the visitor sees when the model or a dependency fails. */
export const AGENT_UNAVAILABLE = "El agente no responde ahora mismo. Escríbele a Jorge desde Contacto.";

export type TraceData = {
  mode: AgentMode;
  steps: { name: "classify" | "retrieve" | "generate" | "verify"; ms: number }[];
  retrieved: { id: number; title: string; url: string | null; sourceType: string; score: number }[];
  tokens: { input: number; output: number };
  costUsd: number;
  model: string;
  invalidCitations: number;
};

/** Real pipeline stages, shown live in the agent box (transient parts). */
export const PROGRESS_STEPS = ["read", "search", "compare", "write"] as const;
export type ProgressStep = (typeof PROGRESS_STEPS)[number];

export type AgentUIMessage = UIMessage<
  never,
  { trace: TraceData; report: MatchReport; progress: { step: ProgressStep } }
>;

export type AgentDeps = {
  models: { chat: LanguageModel; fast: LanguageModel; chatModelId: string; fastModelId: string };
  retrieval: RetrievalDeps;
  cases: Case[];
  calBookingUrl?: string;
  createLead: AgentToolDeps["createLead"];
  /** Called once with the answer's estimated cost (daily budget, §9). */
  onCost?: (costUsd: number) => Promise<void> | void;
  now?: () => number;
};

const toUsage = (model: string, usage: LanguageModelUsage | undefined): Usage => ({
  model,
  inputTokens: usage?.inputTokens ?? 0,
  outputTokens: usage?.outputTokens ?? 0,
});

/** Visitor turns are always wrapped: their text is data, not instructions. */
function toModelMessages(turns: ChatTurn[]): ModelMessage[] {
  return turns.map((turn) =>
    turn.role === "user"
      ? { role: "user", content: wrapVisitorInput(turn.text) }
      : { role: "assistant", content: turn.text },
  );
}

export function runAgent(params: {
  turns: ChatTurn[];
  /** Mode detected on the first message and sent back by the client (§2). */
  mode?: AgentMode;
  lang?: string;
  /** Random id created by the browser per conversation (§11), never personal data. */
  sessionId?: string;
  deps: AgentDeps;
}) {
  const { turns, deps } = params;
  const lang = params.lang ?? "es";
  const now = deps.now ?? (() => performance.now());
  const lastVisitor = turns.filter((turn) => turn.role === "user").at(-1)?.text ?? "";
  const firstVisitor = turns.find((turn) => turn.role === "user")?.text ?? lastVisitor;

  return createUIMessageStream<AgentUIMessage>({
    // Details stay in the server log; the visitor gets the §14 message.
    onError: (error) => {
      console.error("[agent]", error instanceof Error ? `${error.name}: ${error.message}` : error);
      return AGENT_UNAVAILABLE;
    },
    // §11: one Langfuse trace per request. Without a registered tracer
    // provider (tests, missing keys) every span below is a no-op.
    execute: ({ writer }) =>
      propagateAttributes(
        { traceName: "agent", sessionId: params.sessionId, tags: [`lang:${lang}`] },
        () =>
          startActiveObservation(
            "agent",
            async (root) => {
              root.update({ input: lastVisitor });
              const answer = await execute(writer);
              root.update({ output: answer });
            },
            { asType: "agent" },
          ),
      ),
  });

  async function execute(writer: UIMessageStreamWriter<AgentUIMessage>) {
    const progress = (step: ProgressStep) =>
      writer.write({ type: "data-progress", data: { step }, transient: true });
    progress("read");
    const steps: TraceData["steps"] = [];
    const usages: Usage[] = [];
    let invalidCitations = 0;
    let leadCreated = false;
    let hasGaps = false;

    // 2. Mode, kept for the whole conversation once known.
    let mode = params.mode && AGENT_MODES.includes(params.mode) ? params.mode : undefined;
    if (!mode) {
      const start = now();
      const classified = await startActiveObservation("classify", async (span) => {
        const result = await classifyMode(firstVisitor, deps.models.fast);
        span.update({ output: result.mode });
        return result;
      });
      mode = classified.mode;
      usages.push(toUsage(deps.models.fastModelId, classified.usage));
      steps.push({ name: "classify", ms: Math.round(now() - start) });
    }
    const firstTurn = turns.filter((t) => t.role === "user").length === 1;

    // 3. Retrieval. Out of scope: no sources and no tools, nothing to leak.
    progress("search");
    let sources: Source[] = [];
    if (mode !== "out_of_scope") {
      const start = now();
      sources = await startActiveObservation(
        "retrieve",
        async (span) => {
          let found: Source[];
          if (mode === "vacancy" && firstTurn) {
            const extracted = await extractRequirements(lastVisitor, deps.models.fast);
            usages.push(toUsage(deps.models.fastModelId, extracted.usage));
            found = await retrieveForRequirements(
              extracted.requirements.length ? extracted.requirements : [lastVisitor],
              deps.retrieval,
              { lang },
            );
          } else {
            found = await retrieve(lastVisitor, deps.retrieval, { lang });
          }
          span.update({
            output: found.map((source) => ({ id: source.id, title: source.title, score: source.score })),
          });
          return found;
        },
        { asType: "retriever" },
      );
      steps.push({ name: "retrieve", ms: Math.round(now() - start) });
    }
    progress("compare");
    const registry = new SourceRegistry(sources);
    const system = buildSystemPrompt({ mode, sources });
    const messages = toModelMessages(turns);

    const answer = await startActiveObservation("generate", async () => {
      // 4a. Vacancy: structured fit report (§7), with every source id checked.
      if (mode === "vacancy" && firstTurn) {
        const start = now();
        const generated = await generateText({
          model: deps.models.chat,
          system: `${system}\n\nGenera el reporte de encaje estructurado. Cada encaje necesita al menos una fuente válida en sourceIds.`,
          messages,
          output: Output.object({ schema: MatchReportSchema }),
          abortSignal: AbortSignal.timeout(LLM_TIMEOUT_MS),
          telemetry: { functionId: "match_report" },
        });
        usages.push(toUsage(deps.models.chatModelId, generated.usage));
        const valid = registry.ids();
        const matches = generated.output.matches
          .map((match) => {
            const sourceIds = match.sourceIds.filter((id) => valid.has(id));
            invalidCitations += match.sourceIds.length - sourceIds.length;
            return { ...match, sourceIds };
          })
          // Evidence without a real source is not evidence.
          .filter((match) => match.sourceIds.length > 0);
        const report: MatchReport = { ...generated.output, matches };
        hasGaps = report.gaps.length > 0;
        writer.write({ type: "data-report", data: report });
        steps.push({ name: "generate", ms: Math.round(now() - start) });
      }

      // 4b. Streamed answer with tools; invalid citations removed on the fly.
      progress("write");
      const start = now();
      const tools =
        mode === "out_of_scope"
          ? undefined
          : createAgentTools({
              mode,
              lastVisitorMessage: lastVisitor,
              cases: deps.cases,
              calBookingUrl: deps.calBookingUrl,
              registry,
              // The registry renumbers tool results after the initial sources.
              search: (query) => retrieve(query, deps.retrieval, { lang }),
              createLead: async (input) => {
                const leadId = await deps.createLead(input);
                leadCreated = true;
                return leadId;
              },
            });

      const result = streamText({
        model: deps.models.chat,
        system,
        messages,
        tools,
        stopWhen: isStepCount(MAX_TOOL_STEPS),
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        abortSignal: AbortSignal.timeout(LLM_TIMEOUT_MS),
        experimental_transform: citationTransform(
          () => registry.ids(),
          () => {
            invalidCitations += 1;
          },
        ),
        telemetry: { functionId: "answer" },
      });

      writer.merge(toUIMessageStream({ stream: result.stream }));
      usages.push(toUsage(deps.models.chatModelId, await result.totalUsage));
      const generateMs = Math.round(now() - start);
      const generateStep = steps.find((step) => step.name === "generate");
      if (generateStep) generateStep.ms += generateMs;
      else steps.push({ name: "generate", ms: generateMs });
      return result.text;
    });

    // 5. Citations were filtered while streaming; this span records the result
    // and carries the tags only known at the end (mode, gaps, lead).
    const tags = [
      `lang:${lang}`,
      `mode:${mode}`,
      ...(hasGaps ? ["gaps"] : []),
      ...(leadCreated ? ["lead"] : []),
    ];
    propagateAttributes({ tags }, () =>
      startActiveObservation(
        "verify_citations",
        (span) => span.update({ output: { invalidCitations, valid: registry.ids().size } }),
        { asType: "guardrail" },
      ),
    );
    steps.push({ name: "verify", ms: 0 });

    // 6. "Bajo el capó" (§10).
    const costUsd = estimateCost(usages);
    await deps.onCost?.(costUsd);
    writer.write({
      type: "data-trace",
      data: {
        mode,
        steps,
        retrieved: registry.all().map((source) => ({
          id: source.id,
          title: source.title,
          url: source.url,
          sourceType: source.sourceType,
          score: Number(source.score.toFixed(4)),
        })),
        tokens: {
          input: usages.reduce((sum, usage) => sum + usage.inputTokens, 0),
          output: usages.reduce((sum, usage) => sum + usage.outputTokens, 0),
        },
        costUsd: Number(costUsd.toFixed(6)),
        model: deps.models.chatModelId,
        invalidCitations,
      },
    });
    return answer;
  }
}
