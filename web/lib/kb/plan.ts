import { createHash } from "node:crypto";
import type { KbChunk } from "./chunk";
import type { KbDocument } from "./sources";
import { normalize } from "./text";

// Idempotent ingestion (docs/agent-spec.md §4): only documents whose content
// hash changed are re-embedded; documents that disappeared are deleted.

export type PreparedDocument = { doc: KbDocument; chunks: KbChunk[]; hash: string };
export type StoredDocument = {
  id: string;
  sourceType: string;
  slug: string;
  lang: string;
  contentHash: string;
};

export const documentKey = (d: { sourceType: string; slug: string; lang: string }) =>
  `${d.sourceType}:${d.slug}:${d.lang}`;

export function contentHash(chunks: KbChunk[]): string {
  const text = normalize(chunks.map((chunk) => chunk.content).join("\n"));
  return createHash("sha256").update(text).digest("hex");
}

export function planIngest(prepared: PreparedDocument[], stored: StoredDocument[]) {
  const storedByKey = new Map(stored.map((d) => [documentKey(d), d]));
  const preparedKeys = new Set(prepared.map((p) => documentKey(p.doc)));

  const create: PreparedDocument[] = [];
  const update: (PreparedDocument & { id: string })[] = [];
  let unchanged = 0;

  for (const item of prepared) {
    const existing = storedByKey.get(documentKey(item.doc));
    if (!existing) create.push(item);
    else if (existing.contentHash !== item.hash) update.push({ ...item, id: existing.id });
    else unchanged += 1;
  }

  const remove = stored.filter((d) => !preparedKeys.has(documentKey(d)));
  return { create, update, remove, unchanged };
}
