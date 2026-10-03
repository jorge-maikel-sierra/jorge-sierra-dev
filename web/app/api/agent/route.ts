import { createUIMessageStreamResponse } from "ai";
import { z } from "zod";
import { runAgent } from "@/lib/ai/agent";
import { createAgentRuntime } from "@/lib/ai/deps";
import { checkInput, type ChatTurn } from "@/lib/ai/guardrails";
import { AGENT_MODES } from "@/lib/ai/mode";
import { AGENT_ENV, env, pickEnv } from "@/lib/env";
import { createAgentLimiter } from "@/lib/ratelimit";

export const maxDuration = 60;

const MAX_BODY_BYTES = 128 * 1024;

const Body = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        parts: z.array(z.object({ type: z.string(), text: z.string().optional() }).loose()),
      }),
    )
    .min(1),
  mode: z.enum(AGENT_MODES).optional(),
  locale: z.string().optional(),
});

const clientIp = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  request.headers.get("x-real-ip") ||
  "unknown";

const json = (body: object, status: number, headers?: HeadersInit) =>
  Response.json(body, { status, headers });

export async function POST(request: Request) {
  const config = pickEnv(AGENT_ENV);
  if (!config) return json({ error: "unavailable" }, 503);

  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return json({ error: "too_large" }, 413);
  }

  // 1. Guards (docs/agent-spec.md §3).
  const limited = await createAgentLimiter(
    config.UPSTASH_REDIS_REST_URL,
    config.UPSTASH_REDIS_REST_TOKEN,
  )(clientIp(request));
  if (!limited.success) {
    const retryAfter = Math.max(1, Math.ceil((limited.reset - Date.now()) / 1000));
    return json({ error: "rate_limited", retryAfter }, 429, { "Retry-After": String(retryAfter) });
  }

  const { deps, budget } = createAgentRuntime({
    ...config,
    AI_MODEL: env.AI_MODEL,
    CAL_BOOKING_URL: env.CAL_BOOKING_URL,
  });
  if (await budget.exhausted()) return json({ error: "budget" }, 503);

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid" }, 400);

  // System messages from the client are ignored: only the server writes rules.
  const turns: ChatTurn[] = parsed.data.messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role as ChatTurn["role"],
      text: message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text ?? "")
        .join("\n"),
    }));
  const problem = checkInput(turns);
  if (problem) return json({ error: problem }, 400);

  return createUIMessageStreamResponse({
    stream: runAgent({
      turns,
      mode: parsed.data.mode,
      lang: parsed.data.locale === "en" ? "en" : "es",
      deps,
    }),
  });
}
