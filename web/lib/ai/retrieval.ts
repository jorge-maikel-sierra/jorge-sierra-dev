// Retrieval for the agent (docs/agent-spec.md §5). Hybrid search runs in SQL
// (match_kb_chunks: vector + lexical fused with RRF); this module applies the
// relevance threshold, fuses per-requirement lists and numbers the sources.

/**
 * Minimum cosine similarity for a chunk to reach the model. Calibrated on the
 * real knowledge base (task 4.3): relevant questions peaked at 0.377–0.591,
 * off-topic ones at 0.130–0.335. RRF scores cannot gate relevance: they are
 * rank-based and identical for on- and off-topic queries.
 */
export const MIN_SIMILARITY = 0.35;
export const RRF_K = 60;
export const DEFAULT_MATCH_COUNT = 8;

export type RetrievedChunk = {
  chunkId: number;
  title: string;
  url: string | null;
  sourceType: string;
  section: string;
  content: string;
  score: number;
  similarity: number;
};

/** A chunk numbered for the prompt: cited as [fuente:id]. */
export type Source = RetrievedChunk & { id: number };

export type RetrievalDeps = {
  embedQuery(query: string): Promise<number[]>;
  search(params: {
    embedding: number[];
    query: string;
    matchCount: number;
    lang: string;
  }): Promise<RetrievedChunk[]>;
};

export function aboveThreshold(chunks: RetrievedChunk[], minSimilarity = MIN_SIMILARITY) {
  return chunks.filter((chunk) => chunk.similarity >= minSimilarity);
}

/**
 * Reciprocal Rank Fusion of several ranked lists (same formula as the SQL):
 * score = Σ 1 / (k + rank). Used to merge per-requirement retrievals in
 * vacancy mode; duplicates keep their best data and add up their score.
 */
export function rrfFuse(lists: RetrievedChunk[][], k = RRF_K): RetrievedChunk[] {
  const fused = new Map<number, { chunk: RetrievedChunk; score: number }>();
  for (const list of lists) {
    list.forEach((chunk, index) => {
      const add = 1 / (k + index + 1);
      const current = fused.get(chunk.chunkId);
      if (current) current.score += add;
      else fused.set(chunk.chunkId, { chunk, score: add });
    });
  }
  return [...fused.values()]
    .sort((a, b) => b.score - a.score)
    .map(({ chunk, score }) => ({ ...chunk, score }));
}

export const numberSources = (chunks: RetrievedChunk[]): Source[] =>
  chunks.map((chunk, index) => ({ ...chunk, id: index + 1 }));

export async function retrieve(
  query: string,
  deps: RetrievalDeps,
  options: { lang?: string; matchCount?: number; minSimilarity?: number } = {},
): Promise<Source[]> {
  const embedding = await deps.embedQuery(query);
  const chunks = await deps.search({
    embedding,
    query,
    matchCount: options.matchCount ?? DEFAULT_MATCH_COUNT,
    lang: options.lang ?? "es",
  });
  return numberSources(aboveThreshold(chunks, options.minSimilarity));
}

/**
 * Vacancy mode: retrieve per requirement (top 3 each), fuse and deduplicate,
 * keep the best `matchCount` overall.
 */
export async function retrieveForRequirements(
  requirements: string[],
  deps: RetrievalDeps,
  options: { lang?: string; perRequirement?: number; matchCount?: number; minSimilarity?: number } = {},
): Promise<Source[]> {
  const lists = await Promise.all(
    requirements.slice(0, 10).map(async (requirement) => {
      const embedding = await deps.embedQuery(requirement);
      const chunks = await deps.search({
        embedding,
        query: requirement,
        matchCount: options.perRequirement ?? 3,
        lang: options.lang ?? "es",
      });
      return aboveThreshold(chunks, options.minSimilarity);
    }),
  );
  return numberSources(rrfFuse(lists).slice(0, options.matchCount ?? 12));
}

const escapeAttribute = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
// Content cannot close its own tag and break the prompt structure.
const escapeContent = (value: string) => value.replace(/<\/?fuente/gi, "‹fuente");

/** `<fuente id="3" titulo="Paga Diario" url="…">…</fuente>` (agent-spec §5). */
export function formatSources(sources: Source[]): string {
  return sources
    .map(
      (source) =>
        `<fuente id="${source.id}" titulo="${escapeAttribute(source.title)}"` +
        (source.url ? ` url="${escapeAttribute(source.url)}"` : "") +
        `>\n${escapeContent(source.content)}\n</fuente>`,
    )
    .join("\n");
}
