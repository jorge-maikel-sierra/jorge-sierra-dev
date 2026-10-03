import { runAgent } from "@/lib/ai/agent";
import { createAgentRuntime } from "@/lib/ai/deps";
import { AGENT_ENV, env, pickEnv } from "@/lib/env";
import { flushLangfuse, registerLangfuse } from "@/lib/observability/langfuse";

// Dev helper: `pnpm ask [--lang=en] "pregunta"` runs the real agent once and prints the stream.

async function main() {
  const args = process.argv.slice(2);
  const lang = args.find((arg) => arg.startsWith("--lang="))?.split("=")[1] ?? "es";
  const question = args.filter((arg) => !arg.startsWith("--lang=")).join(" ");
  if (!question) throw new Error('Usage: pnpm ask "<question>"');
  const config = pickEnv(AGENT_ENV);
  if (!config) throw new Error("Missing agent environment variables");

  const traced = registerLangfuse();
  const { deps } = createAgentRuntime({ ...config, AI_MODEL: env.AI_MODEL });
  const stream = runAgent({
    turns: [{ role: "user", text: question }],
    lang,
    sessionId: `cli-${Date.now()}`,
    deps,
  });

  let text = "";
  const reader = stream.getReader();
  for (let next = await reader.read(); !next.done; next = await reader.read()) {
    const chunk = next.value;
    if (chunk.type === "text-delta") text += chunk.delta;
    else if (chunk.type === "error") console.log("ERROR:", chunk.errorText);
    else if (chunk.type === "data-report" || chunk.type === "data-trace") {
      console.log(`\n[${chunk.type}]`, JSON.stringify(chunk.data, null, 2));
    } else if (chunk.type.startsWith("tool-")) console.log(`[${chunk.type}]`);
  }
  console.log("\n[text]\n" + text);
  if (traced) {
    await flushLangfuse();
    console.log("\n[langfuse] trace sent");
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
