// pnpm kb:ingest — indexes content/ and the featured READMEs into Supabase
// (docs/agent-spec.md §4). Idempotent: unchanged documents are not re-embedded.
import { createServiceClient } from "@/lib/supabase/server";
import { loadCases, loadExperience, loadProfile, locales } from "@/lib/content/load";
import { parseEnv } from "@/lib/env";
import { chunkDocument } from "@/lib/kb/chunk";
import { createEmbedder } from "@/lib/kb/embed";
import { contentHash, planIngest, type PreparedDocument } from "@/lib/kb/plan";
import {
  caseDocuments,
  experienceDocuments,
  FEATURED_REPOS,
  profileDocument,
  repoDocument,
  type KbDocument,
} from "@/lib/kb/sources";

const env = parseEnv(process.env, [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "EMBEDDING_PROVIDER",
  "EMBEDDING_MODEL",
  "EMBEDDING_DIMENSIONS",
  "EMBEDDING_API_KEY",
]);

async function fetchReadme(repo: string): Promise<string | null> {
  const response = await fetch(
    `https://api.github.com/repos/jorge-maikel-sierra/${repo}/readme`,
    {
      headers: {
        Accept: "application/vnd.github.raw+json",
        ...(env.GITHUB_TOKEN ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}),
      },
    },
  );
  if (!response.ok) {
    console.warn(`  ! README de ${repo}: HTTP ${response.status}, se omite`);
    return null;
  }
  return response.text();
}

async function collectDocuments(): Promise<KbDocument[]> {
  const docs: KbDocument[] = [];
  for (const lang of locales) {
    docs.push(profileDocument(loadProfile(lang), lang));
    docs.push(...experienceDocuments(loadExperience(lang), lang));
    docs.push(...caseDocuments(loadCases(lang), lang));
  }
  for (const repo of FEATURED_REPOS) {
    const readme = await fetchReadme(repo);
    if (readme) docs.push(repoDocument(repo, readme, "es"));
  }
  return docs;
}

async function main() {
  const db = createServiceClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!);
  const embed = createEmbedder({
    provider: env.EMBEDDING_PROVIDER!,
    apiKey: env.EMBEDDING_API_KEY!,
    model: env.EMBEDDING_MODEL!,
    dimensions: env.EMBEDDING_DIMENSIONS!,
  });

  const prepared: PreparedDocument[] = (await collectDocuments())
    .map((doc) => {
      const chunks = chunkDocument(doc);
      return { doc, chunks, hash: contentHash(chunks) };
    })
    .filter((item) => item.chunks.length > 0);

  const { data: stored, error } = await db
    .from("kb_documents")
    .select("id, source_type, slug, lang, content_hash");
  if (error) throw error;

  const plan = planIngest(
    prepared,
    (stored ?? []).map((row) => ({
      id: row.id,
      sourceType: row.source_type,
      slug: row.slug,
      lang: row.lang,
      contentHash: row.content_hash,
    })),
  );

  if (plan.remove.length) {
    const { error: removeError } = await db
      .from("kb_documents")
      .delete()
      .in("id", plan.remove.map((d) => d.id));
    if (removeError) throw removeError;
  }

  const toEmbed = [...plan.create, ...plan.update];
  const { embeddings, tokens } = await embed(
    toEmbed.flatMap((item) => item.chunks.map((chunk) => chunk.content)),
  );

  let cursor = 0;
  for (const item of toEmbed) {
    const row = {
      source_type: item.doc.sourceType,
      slug: item.doc.slug,
      title: item.doc.title,
      url: item.doc.url,
      lang: item.doc.lang,
      content_hash: item.hash,
      updated_at: new Date().toISOString(),
    };

    let documentId: string;
    if ("id" in item) {
      documentId = item.id as string;
      const updated = await db.from("kb_documents").update(row).eq("id", documentId);
      if (updated.error) throw updated.error;
      const cleared = await db.from("kb_chunks").delete().eq("document_id", documentId);
      if (cleared.error) throw cleared.error;
    } else {
      const inserted = await db.from("kb_documents").insert(row).select("id").single();
      if (inserted.error) throw inserted.error;
      documentId = inserted.data.id;
    }

    const chunkRows = item.chunks.map((chunk) => ({
      document_id: documentId,
      chunk_index: chunk.index,
      content: chunk.content,
      metadata: chunk.metadata,
      embedding: JSON.stringify(embeddings[cursor++]),
    }));
    const chunkInsert = await db.from("kb_chunks").insert(chunkRows);
    if (chunkInsert.error) throw chunkInsert.error;
  }

  const { count } = await db.from("kb_chunks").select("id", { count: "exact", head: true });
  console.log(
    [
      "Ingesta completa:",
      `  documentos nuevos:       ${plan.create.length}`,
      `  documentos actualizados: ${plan.update.length}`,
      `  documentos sin cambios:  ${plan.unchanged}`,
      `  documentos borrados:     ${plan.remove.length}`,
      `  fragmentos embebidos:    ${embeddings.length} (${tokens} tokens)`,
      `  fragmentos totales:      ${count ?? "?"}`,
    ].join("\n"),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
