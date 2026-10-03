import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { LangfuseClient } from "@langfuse/client";
import { getActiveTraceId, startActiveObservation } from "@langfuse/tracing";
import { runAgent, type TraceData } from "@/lib/ai/agent";
import { createAgentRuntime } from "@/lib/ai/deps";
import type { MatchReport } from "@/lib/ai/mode";
import type { RetrievedChunk } from "@/lib/ai/retrieval";
import { AGENT_ENV, env, LANGFUSE_ENV, pickEnv } from "@/lib/env";
import { flushLangfuse, registerLangfuse } from "@/lib/observability/langfuse";
import { createServiceClient } from "@/lib/supabase/server";
import {
  citationScore,
  countCitations,
  countMalformedCitations,
  EvalCaseSchema,
  judgeFaithfulness,
  judgeGaps,
  judgeRefusal,
  METRIC_LABELS,
  phraseHits,
  recallAt8,
  summarize,
  visibleAnswer,
  type AgentRun,
  type EvalCase,
  type Metric,
} from "./judges";

// `pnpm evals` (docs/agent-spec.md §12): runs every case against the real
// agent and knowledge base, judges it, prints a table, writes
// evals/report.json and exits ≠ 0 when a threshold fails.
// Usage: pnpm evals [--subset=pr] [--only=gen-001,vac-002] [--concurrency=2]

const DIR = path.join(process.cwd(), "evals");
const DATASET = "agent-evals";

/**
 * What every PR runs (≈US$0.70 instead of ≈US$2.50 for the 31 cases, estimated
 * from the Langfuse usage of 2026-10-03): every
 * metric and case type is covered, including the costly vacancies with gaps.
 * The full dataset runs on demand (workflow_dispatch or locally).
 */
export const PR_SUBSET = [
  "gen-001",
  "gen-003",
  "gen-007",
  "gen-012",
  "vac-002",
  "vac-004",
  "oos-001",
  "oos-003",
  "inj-001",
  "inj-005",
];

const arg = (name: string) =>
  process.argv.find((value) => value.startsWith(`--${name}=`))?.split("=")[1];

function loadDataset(): EvalCase[] {
  const only = arg("only")?.split(",") ?? (arg("subset") === "pr" ? PR_SUBSET : undefined);
  return readFileSync(path.join(DIR, "dataset.jsonl"), "utf8")
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => EvalCaseSchema.parse(JSON.parse(line)))
    .filter((testCase) => !only || only.includes(testCase.id));
}

/** Runs async tasks with a fixed number in flight. */
async function pool<T, R>(items: T[], size: number, task: (item: T) => Promise<R>) {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
  return results;
}

type CaseResult = {
  id: string;
  type: EvalCase["type"];
  mode: string;
  traceId?: string;
  answer?: string;
  scores: Partial<Record<Metric, number>>;
  /** must_include phrases that were missing (informational, no threshold). */
  missing: string[];
  details: unknown;
  error?: string;
};

async function main() {
  const config = pickEnv(AGENT_ENV);
  if (!config) throw new Error("Missing agent environment variables");
  const traced = registerLangfuse();
  const runtime = createAgentRuntime({ ...config, AI_MODEL: env.AI_MODEL });
  // Haiku judges: about half the cost of Sonnet. The answers are still
  // produced by the production chat model.
  const judge = runtime.deps.models.fast;

  // Retrieved chunks carry title and type; the dataset speaks in document keys.
  const db = createServiceClient(config.NEXT_PUBLIC_SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
  const { data: documents, error } = await db
    .from("kb_documents")
    .select("source_type, slug, title")
    .eq("lang", "es");
  if (error) throw error;
  const keyOf = new Map(
    (documents ?? []).map((doc) => [`${doc.source_type}|${doc.title}`, `${doc.source_type}:${doc.slug}`]),
  );

  async function runCase(testCase: EvalCase): Promise<AgentRun> {
    const seen = new Map<number, RetrievedChunk>();
    const toolCalls: string[] = [];
    const deps = {
      ...runtime.deps,
      // Evals never touch the visitor budget or store leads.
      onCost: undefined,
      createLead: async () => {
        toolCalls.push("createLead");
        return "eval-lead";
      },
      retrieval: {
        ...runtime.deps.retrieval,
        search: async (params: Parameters<typeof runtime.deps.retrieval.search>[0]) => {
          const chunks = await runtime.deps.retrieval.search(params);
          for (const chunk of chunks) seen.set(chunk.chunkId, chunk);
          return chunks;
        },
      },
    };

    const reader = runAgent({
      turns: [{ role: "user", text: testCase.input }],
      sessionId: `eval-${testCase.id}`,
      deps,
    }).getReader();

    let text = "";
    let report: MatchReport | null = null;
    let trace: TraceData | null = null;
    for (let next = await reader.read(); !next.done; next = await reader.read()) {
      const chunk = next.value;
      if (chunk.type === "text-delta") text += chunk.delta;
      else if (chunk.type === "data-report") report = chunk.data;
      else if (chunk.type === "data-trace") trace = chunk.data;
      else if (chunk.type === "tool-input-available" && chunk.toolName !== "createLead") {
        toolCalls.push(chunk.toolName);
      } else if (chunk.type === "error") throw new Error(chunk.errorText);
    }
    if (!trace) throw new Error("The agent finished without a trace");

    const reportCitations = report
      ? (report as MatchReport).matches.reduce((sum, match) => sum + match.sourceIds.length, 0)
      : 0;
    return {
      text,
      report,
      mode: trace.mode,
      retrievedKeys: trace.retrieved.map(
        (source) => keyOf.get(`${source.sourceType}|${source.title}`) ?? `?:${source.title}`,
      ),
      sources: [...seen.values()].map((chunk) => ({ title: chunk.title, content: chunk.content })),
      toolCalls,
      validCitations: countCitations(text) + reportCitations,
      invalidCitations: trace.invalidCitations,
      malformedCitations: countMalformedCitations(text),
    };
  }

  async function evaluate(testCase: EvalCase): Promise<CaseResult> {
    return startActiveObservation(`eval:${testCase.id}`, async (span) => {
      const traceId = getActiveTraceId();
      const base = { id: testCase.id, type: testCase.type, traceId };
      try {
        const run = await runCase(testCase);
        span.update({ input: testCase.input, output: visibleAnswer(run) });
        // Answers about Jorge must cite; refusals have nothing to cite.
        const citations = citationScore(run, {
          mustCite: testCase.type === "general" || testCase.type === "vacancy",
        });

        if (testCase.type === "general" || testCase.type === "vacancy") {
          const faithfulness = await judgeFaithfulness(judge, run);
          const scores: CaseResult["scores"] = { faithfulness: faithfulness.score, citations };
          const details: Record<string, unknown> = { unsupported: faithfulness.unsupported };
          let missing: string[] = [];
          if (testCase.type === "general") {
            scores.recall = recallAt8(testCase.expected_sources, run.retrievedKeys);
            details.retrieved = run.retrievedKeys.slice(0, 8);
            missing = testCase.must_include.filter(
              (phrase) => !phraseHits(visibleAnswer(run), [phrase]).length,
            );
            const forbidden = phraseHits(visibleAnswer(run), testCase.must_not_include);
            if (forbidden.length) details.forbidden = forbidden;
          } else {
            const gaps = await judgeGaps(judge, testCase, run);
            if (gaps) {
              scores.gaps = gaps.score;
              details.gaps = gaps.verdicts;
            }
            missing = testCase.expected_matches.filter(
              (phrase) => !phraseHits(visibleAnswer(run), [phrase]).length,
            );
          }
          return { ...base, mode: run.mode, answer: visibleAnswer(run), scores, missing, details };
        }

        const refusal = await judgeRefusal(judge, testCase, run);
        return {
          ...base,
          mode: run.mode,
          answer: visibleAnswer(run),
          scores: { refusal: refusal.passed ? 1 : 0, citations },
          missing: [],
          details: refusal,
        };
      } catch (caught) {
        // A crash counts as a failure on every metric the case feeds.
        const message = caught instanceof Error ? caught.message : String(caught);
        const failed: CaseResult["scores"] =
          testCase.type === "general"
            ? { faithfulness: 0, recall: 0 }
            : testCase.type === "vacancy"
              ? { faithfulness: 0, ...(testCase.expected_gaps.length ? { gaps: 0 } : {}) }
              : { refusal: 0 };
        return { ...base, mode: "error", scores: failed, missing: [], details: null, error: message };
      }
    });
  }

  const dataset = loadDataset();
  const concurrency = Number(arg("concurrency") ?? 2);
  console.log(`Evaluando ${dataset.length} casos (concurrencia ${concurrency})…\n`);
  const results = await pool(dataset, concurrency, async (testCase) => {
    const result = await evaluate(testCase);
    const scores = Object.entries(result.scores)
      .map(([metric, value]) => `${metric}=${Number(value).toFixed(2)}`)
      .join(" ");
    console.log(`${result.error ? "✗" : "·"} ${result.id.padEnd(8)} ${result.mode.padEnd(13)} ${scores}${result.error ? ` ERROR: ${result.error}` : ""}`);
    return result;
  });

  const byMetric = Object.fromEntries(
    (Object.keys(METRIC_LABELS) as Metric[]).map((metric) => [
      metric,
      results.flatMap((result) => (result.scores[metric] === undefined ? [] : [result.scores[metric]])),
    ]),
  ) as Record<Metric, number[]>;
  const summary = summarize(byMetric);

  const table = [
    "| Métrica | Valor | Umbral | Casos | |",
    "|---|---|---|---|---|",
    ...summary.map(
      (row) =>
        `| ${METRIC_LABELS[row.metric]} | ${(row.value * 100).toFixed(1)} % | ${(row.threshold * 100).toFixed(0)} % | ${row.cases} | ${row.passed ? "✓" : "✗"} |`,
    ),
  ].join("\n");
  console.log(`\n${table}`);
  // GitHub Actions renders the same table on the job page.
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Evals del agente\n\n${table}\n`);
  }
  const weak = results.filter((result) => result.missing.length);
  if (weak.length) {
    console.log("\nFrases esperadas que faltaron (informativo):");
    for (const result of weak) console.log(`  ${result.id}: ${result.missing.join(", ")}`);
  }

  const runName = `evals-${process.env.GITHUB_SHA?.slice(0, 7) ?? new Date().toISOString()}`;
  writeFileSync(
    path.join(DIR, "report.json"),
    JSON.stringify({ runName, model: runtime.deps.models.chatModelId, summary, results }, null, 2),
  );
  console.log(`\nReporte: evals/report.json`);

  if (traced) {
    await flushLangfuse();
    await publishToLangfuse(dataset, results, runName);
  }

  // A crash is not a quality verdict: say so instead of blaming a metric.
  const crashed = results.filter((result) => result.error);
  if (crashed.length) {
    console.error(`\n✗ ${crashed.length} casos no se pudieron evaluar (errores de ejecución, no de calidad):`);
    for (const result of crashed) console.error(`  ${result.id}: ${result.error}`);
  }
  const failed = summary.filter((row) => !row.passed);
  if (failed.length || crashed.length) {
    if (failed.length) {
      console.error(`\n✗ Umbral no alcanzado: ${failed.map((row) => METRIC_LABELS[row.metric]).join(", ")}`);
    }
    process.exit(1);
  }
  console.log("\n✓ Todos los umbrales se cumplen");
}

/** §11: each run becomes a Langfuse dataset run, with one score per metric. */
async function publishToLangfuse(dataset: EvalCase[], results: CaseResult[], runName: string) {
  const config = pickEnv(LANGFUSE_ENV);
  if (!config) return;
  const client = new LangfuseClient({
    publicKey: config.LANGFUSE_PUBLIC_KEY,
    secretKey: config.LANGFUSE_SECRET_KEY,
    baseUrl: config.LANGFUSE_BASE_URL,
  });
  try {
    await client.api.datasets.create({ name: DATASET, description: "docs/agent-spec.md §12" }).catch(() => {});
    for (const testCase of dataset) {
      // Upsert by id: the dataset in Langfuse mirrors evals/dataset.jsonl.
      await client.api.datasetItems.create({
        datasetName: DATASET,
        id: testCase.id,
        input: testCase.input,
        expectedOutput: testCase,
      });
    }
    for (const result of results) {
      if (!result.traceId) continue;
      await client.api.datasetRunItems.create({
        runName,
        datasetItemId: result.id,
        traceId: result.traceId,
      });
      for (const [metric, value] of Object.entries(result.scores)) {
        client.score.create({ traceId: result.traceId, name: metric, value });
      }
    }
    await client.score.flush();
    console.log(`Langfuse: dataset run "${runName}" publicado`);
  } catch (caught) {
    // Publishing is a convenience: it never changes the eval verdict.
    console.warn("Langfuse: no se pudo publicar el dataset run:", caught instanceof Error ? caught.message : caught);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
