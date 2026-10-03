import { Redis } from "@upstash/redis";
import { loadCases } from "@/lib/content/load";
import { createLeadStore } from "@/lib/contact/store";
import type { AGENT_ENV, Env } from "@/lib/env";
import { createEmbedder } from "@/lib/kb/embed";
import { createServiceClient } from "@/lib/supabase/server";
import type { AgentDeps } from "./agent";
import { createBudget } from "./cost";
import { createModels } from "./model";
import type { RetrievedChunk } from "./retrieval";

type AgentConfig = { [K in (typeof AGENT_ENV)[number]]: NonNullable<Env[K]> } & {
  AI_MODEL?: string;
  CAL_BOOKING_URL?: string;
};

type MatchRow = {
  chunk_id: number;
  title: string;
  url: string | null;
  source_type: string;
  content: string;
  metadata: { section?: string } | null;
  score: number;
  similarity: number;
};

/** Production wiring for runAgent: Anthropic, OpenAI embeddings, Supabase, Upstash. */
export function createAgentRuntime(config: AgentConfig) {
  const db = createServiceClient(config.NEXT_PUBLIC_SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
  const embed = createEmbedder({
    provider: config.EMBEDDING_PROVIDER,
    apiKey: config.EMBEDDING_API_KEY,
    model: config.EMBEDDING_MODEL,
    dimensions: config.EMBEDDING_DIMENSIONS,
  });
  const redis = new Redis({
    url: config.UPSTASH_REDIS_REST_URL,
    token: config.UPSTASH_REDIS_REST_TOKEN,
  });
  const budget = createBudget(
    {
      get: async (key) => Number((await redis.get<number | string>(key)) ?? 0),
      add: async (key, amount) => {
        const total = await redis.incrbyfloat(key, amount);
        await redis.expire(key, 60 * 60 * 48);
        return Number(total);
      },
    },
    config.AGENT_DAILY_BUDGET_USD,
  );
  const leads = createLeadStore(db);

  const deps: AgentDeps = {
    models: createModels({
      provider: config.AI_PROVIDER,
      apiKey: config.ANTHROPIC_API_KEY,
      chatModel: config.AI_MODEL,
    }),
    retrieval: {
      embedQuery: async (query) => (await embed([query])).embeddings[0],
      search: async ({ embedding, query, matchCount, lang }) => {
        const { data, error } = await db.rpc("match_kb_chunks", {
          query_embedding: JSON.stringify(embedding),
          query_text: query,
          match_count: matchCount,
          filter_lang: lang,
        });
        if (error) throw error;
        return ((data ?? []) as MatchRow[]).map(
          (row): RetrievedChunk => ({
            chunkId: row.chunk_id,
            title: row.title,
            url: row.url,
            sourceType: row.source_type,
            section: row.metadata?.section ?? "",
            content: row.content,
            score: row.score,
            similarity: row.similarity,
          }),
        );
      },
    },
    cases: loadCases("es"),
    calBookingUrl: config.CAL_BOOKING_URL,
    createLead: ({ kind, name, email, message }) =>
      leads.store({ kind, name, email, message, company: undefined }, "agent"),
    onCost: (costUsd) => budget.spend(costUsd),
  };

  return { deps, budget };
}
