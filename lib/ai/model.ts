import { createAnthropic } from "@ai-sdk/anthropic";

// Model IDs checked against the provider package and the AI Gateway catalog
// (task 4.4). The chat model is configurable with AI_MODEL.
export const DEFAULT_CHAT_MODEL = "claude-sonnet-5-5";
/** "Modelo rápido" for mode classification and requirement extraction (§3). */
export const FAST_MODEL = "claude-haiku-4-5";

export function createModels(config: { provider: string; apiKey: string; chatModel?: string }) {
  if (config.provider !== "anthropic") {
    throw new Error(`AI_PROVIDER "${config.provider}" is not supported yet (use "anthropic")`);
  }
  const anthropic = createAnthropic({ apiKey: config.apiKey });
  const chatModelId = config.chatModel || DEFAULT_CHAT_MODEL;
  return {
    chat: anthropic(chatModelId),
    fast: anthropic(FAST_MODEL),
    chatModelId,
    fastModelId: FAST_MODEL,
  };
}
