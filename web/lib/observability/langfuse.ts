import type { Context } from "@opentelemetry/api";
import { LangfuseSpanProcessor } from "@langfuse/otel";
import { LangfuseVercelAiSdkIntegration } from "@langfuse/vercel-ai-sdk";
import type { ReadableSpan, Span, SpanProcessor } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { registerTelemetry } from "ai";
import { redactPII } from "@/lib/ai/guardrails";
import { LANGFUSE_ENV, pickEnv, type Env } from "@/lib/env";

// docs/agent-spec.md §11. One process-wide processor: Next.js may load this
// module more than once (instrumentation and route bundles), so it lives on
// globalThis and the route can flush the same instance.
const KEY = Symbol.for("jorge-sierra.langfuse");
type Holder = { [KEY]?: SpanProcessor };

const ID_ATTRIBUTE = /(^|[._])id$/;

/**
 * Visitors may paste e-mails or phones. Langfuse's own `mask` only covers its
 * `langfuse.*` attributes, while the AI SDK writes prompts to `gen_ai.*`: this
 * redacts every string attribute before any span leaves the process.
 */
export class RedactingSpanProcessor implements SpanProcessor {
  constructor(private readonly inner: SpanProcessor) {}

  onStart(span: Span, context: Context) {
    this.inner.onStart(span, context);
  }

  onEnd(span: ReadableSpan) {
    const attributes = span.attributes as Record<string, unknown>;
    for (const [key, value] of Object.entries(attributes)) {
      // Ids (session, response, tool call) are random, never personal data.
      if (ID_ATTRIBUTE.test(key)) continue;
      if (typeof value === "string") attributes[key] = redactPII(value);
      else if (Array.isArray(value)) {
        attributes[key] = value.map((item) => (typeof item === "string" ? redactPII(item) : item));
      }
    }
    this.inner.onEnd(span);
  }

  forceFlush() {
    return this.inner.forceFlush();
  }

  shutdown() {
    return this.inner.shutdown();
  }
}

/** Registers Langfuse tracing once. Returns false when it is not configured. */
export function registerLangfuse(source?: Env): boolean {
  const holder = globalThis as Holder;
  if (holder[KEY]) return true;
  const config = pickEnv(LANGFUSE_ENV, source);
  if (!config) return false;

  const processor = new RedactingSpanProcessor(
    new LangfuseSpanProcessor({
      publicKey: config.LANGFUSE_PUBLIC_KEY,
      secretKey: config.LANGFUSE_SECRET_KEY,
      baseUrl: config.LANGFUSE_BASE_URL,
      // Serverless: export each span right away instead of batching.
      exportMode: "immediate",
    }),
  );
  new NodeTracerProvider({ spanProcessors: [processor] }).register();
  registerTelemetry(new LangfuseVercelAiSdkIntegration());
  holder[KEY] = processor;
  return true;
}

/** Sends pending spans before the function instance is frozen. */
export async function flushLangfuse() {
  await (globalThis as Holder)[KEY]?.forceFlush();
}
