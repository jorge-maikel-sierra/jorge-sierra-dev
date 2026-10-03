import type { ReadableSpan, SpanProcessor } from "@opentelemetry/sdk-trace-base";
import { describe, expect, it } from "vitest";
import { RedactingSpanProcessor } from "@/lib/observability/langfuse";

describe("RedactingSpanProcessor", () => {
  it("redacts PII in every string attribute before export, but keeps ids", () => {
    const exported: ReadableSpan[] = [];
    const inner = {
      onStart: () => {},
      onEnd: (span: ReadableSpan) => exported.push(span),
      forceFlush: async () => {},
      shutdown: async () => {},
    } satisfies SpanProcessor;

    const span = {
      attributes: {
        "gen_ai.input.messages": '[{"content":"Soy Ana, ana@empresa.com, +57 318 555 1234"}]',
        "langfuse.observation.output": "Trabajó en IX Colombia 2023 - 2025",
        "ai.prompt.tags": ["ana@empresa.com", 3],
        "session.id": "cli-1791031006128",
        "gen_ai.usage.input_tokens": 4813,
      },
    } as unknown as ReadableSpan;

    new RedactingSpanProcessor(inner).onEnd(span);

    expect(exported[0].attributes).toEqual({
      "gen_ai.input.messages": '[{"content":"Soy Ana, [email], [teléfono]"}]',
      "langfuse.observation.output": "Trabajó en IX Colombia 2023 - 2025",
      "ai.prompt.tags": ["[email]", 3],
      "session.id": "cli-1791031006128",
      "gen_ai.usage.input_tokens": 4813,
    });
  });
});
