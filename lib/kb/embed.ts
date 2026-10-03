import { createOpenAI } from "@ai-sdk/openai";
import { embedMany } from "ai";

export const EMBED_BATCH = 64;

/** Embeddings in batches of 64 (docs/agent-spec.md §4). */
export function createEmbedder(options: {
  provider: string;
  apiKey: string;
  model: string;
  dimensions: number;
}) {
  if (options.provider !== "openai") {
    throw new Error(`EMBEDDING_PROVIDER "${options.provider}" is not supported yet (use "openai")`);
  }
  const openai = createOpenAI({ apiKey: options.apiKey });
  const model = openai.embeddingModel(options.model);

  return async (values: string[]) => {
    const embeddings: number[][] = [];
    let tokens = 0;
    for (let start = 0; start < values.length; start += EMBED_BATCH) {
      const batch = await embedMany({
        model,
        values: values.slice(start, start + EMBED_BATCH),
        providerOptions: { openai: { dimensions: options.dimensions } },
      });
      embeddings.push(...batch.embeddings);
      tokens += batch.usage.tokens;
    }
    // The vector(N) column rejects anything else: fail before writing.
    const wrong = embeddings.find((vector) => vector.length !== options.dimensions);
    if (wrong) {
      throw new Error(`Embedding has ${wrong.length} dimensions, expected ${options.dimensions}`);
    }
    return { embeddings, tokens };
  };
}
