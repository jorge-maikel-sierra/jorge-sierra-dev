// Text helpers for the knowledge base (docs/agent-spec.md §4).

/** Rough token estimate: ~4 characters per token for Spanish and English prose. */
export const estimateTokens = (text: string) => Math.ceil(text.length / 4);

const BRACKETED = /\[[^\]]*\]/;

/**
 * Drops every sentence that contains a "[…]" marker so the agent never repeats
 * missing data as if it were real. Returns "" when nothing real is left.
 */
export function stripPlaceholders(text: string): string {
  if (!BRACKETED.test(text)) return text.trim();
  return text
    // A marker without final punctuation is its own "sentence" too.
    .split(/(?<=[.!?\]])\s+/)
    .filter((sentence) => !BRACKETED.test(sentence))
    .join(" ")
    // "[EMPRESA] · Software…" must not leave a dangling separator behind.
    .replace(/^[\s·•|,;:—–-]+/, "")
    .trim();
}

/**
 * README markdown → indexable text: images and badges go, links keep their
 * label. Brackets here are link syntax, not missing-data markers.
 */
export function cleanMarkdown(markdown: string): string {
  return markdown
    .replace(/<!--[\s\S]*?-->/g, "")
    // Linked badges first: removing the image alone would leave "[](url)".
    .replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/<img[^>]*>/gi, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Whitespace-normalized text: the basis of the content hash. */
export const normalize = (text: string) => text.replace(/\s+/g, " ").trim();
