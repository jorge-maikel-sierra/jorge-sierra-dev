import { describe, expect, it } from "vitest";
import { loadCases, loadExperience, loadProfile } from "@/lib/content/load";
import { chunkDocument, MAX_ENTITY_TOKENS, windows } from "@/lib/kb/chunk";
import { contentHash, planIngest, type PreparedDocument } from "@/lib/kb/plan";
import {
  caseDocuments,
  experienceDocuments,
  profileDocument,
  repoDocument,
  type KbDocument,
} from "@/lib/kb/sources";
import { cleanMarkdown, estimateTokens, stripPlaceholders } from "@/lib/kb/text";

const allDocuments = () => [
  profileDocument(loadProfile("es"), "es"),
  ...experienceDocuments(loadExperience("es"), "es"),
  ...caseDocuments(loadCases("es"), "es"),
];

describe("placeholders never reach the knowledge base", () => {
  it("drops only the sentences that contain a marker", () => {
    expect(
      stripPlaceholders("Calcula la red. [Añade: para quién es] Exporta a Excel."),
    ).toBe("Calcula la red. Exporta a Excel.");
    expect(stripPlaceholders("[Enlace al CV en PDF]")).toBe("");
    expect(stripPlaceholders("Sin marcadores.")).toBe("Sin marcadores.");
  });

  it("indexes no bracketed text from the real content", () => {
    for (const doc of allDocuments()) {
      for (const chunk of chunkDocument(doc)) {
        expect(chunk.content, `${doc.slug}: ${chunk.content}`).not.toMatch(/\[[^\]]*\]/);
      }
    }
  });

  it("keeps real facts next to removed markers", () => {
    const ix = experienceDocuments(loadExperience("es"), "es").find(
      (doc) => doc.slug === "ix-colombia",
    );
    const text = chunkDocument(ix!).map((chunk) => chunk.content).join("\n");
    expect(text).toContain("trazabilidad del 100 %");
    expect(text).toContain("Periodo: 2023 — 2025");
  });
});

describe("internal notes", () => {
  it("never indexes _verify", () => {
    const text = experienceDocuments(loadExperience("es"), "es")
      .flatMap(chunkDocument)
      .map((chunk) => chunk.content)
      .join("\n");
    expect(text).not.toContain("Confirmar");
  });

  it("indexes _agentNote as context for the agent", () => {
    const planned = caseDocuments(loadCases("es"), "es").find(
      (doc) => doc.slug === "ai-support-platform",
    );
    const text = chunkDocument(planned!).map((chunk) => chunk.content).join("\n");
    expect(text).toContain("presentarlo como plan");
  });
});

describe("chunking", () => {
  it("keeps one chunk per JSON entity with a context header", () => {
    const paga = caseDocuments(loadCases("es"), "es").find((doc) => doc.slug === "paga-diario")!;
    const chunks = chunkDocument(paga);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].content.startsWith("# Paga Diario")).toBe(true);
    expect(chunks[0].metadata).toMatchObject({
      source_type: "case",
      slug: "paga-diario",
      lang: "es",
    });
  });

  it("splits an entity above 800 tokens by section", () => {
    const long: KbDocument = {
      sourceType: "case",
      slug: "largo",
      title: "Caso largo",
      url: null,
      lang: "es",
      sections: [
        // ~500 tokens each: over 800 together, under one 600-token window apart.
        { name: "Problema", text: "palabra ".repeat(250) },
        { name: "Decisiones", text: "decisión ".repeat(250) },
      ],
    };
    const chunks = chunkDocument(long);
    expect(estimateTokens(long.sections!.map((s) => s.text).join(" "))).toBeGreaterThan(
      MAX_ENTITY_TOKENS,
    );
    expect(chunks.map((chunk) => chunk.metadata.section)).toEqual(["Problema", "Decisiones"]);
    expect(chunks[1].content.startsWith("# Caso largo — Decisiones")).toBe(true);
  });

  it("windows long markdown with overlap", () => {
    const text = Array.from({ length: 900 }, (_, i) => `w${i}`).join(" ");
    const parts = windows(text, 600, 80);
    expect(parts.length).toBeGreaterThan(1);
    for (const part of parts) expect(estimateTokens(part)).toBeLessThanOrEqual(600);
    const lastWordOfFirst = parts[0].split(" ").at(-1)!;
    expect(parts[1].includes(lastWordOfFirst)).toBe(true);
  });

  it("splits READMEs by heading and drops badges but keeps link labels", () => {
    const doc = repoDocument(
      "demo",
      "# Demo\n![badge](https://img.shields.io/x)\nVer [la demo](https://demo.app).\n\n## Stack\nNestJS y Supabase.",
      "es",
    );
    expect(doc.title).toBe("Demo");
    const chunks = chunkDocument(doc);
    expect(chunks.map((chunk) => chunk.metadata.section)).toEqual(["Demo", "Stack"]);
    expect(chunks[0].content).toContain("Ver la demo.");
    expect(chunks[0].content).not.toContain("shields.io");
    expect(cleanMarkdown("[![b](x)](y) texto")).toBe("texto");
  });
});

describe("idempotent ingestion", () => {
  const prepare = (docs: KbDocument[]): PreparedDocument[] =>
    docs.map((doc) => {
      const chunks = chunkDocument(doc);
      return { doc, chunks, hash: contentHash(chunks) };
    });

  it("re-embeds nothing on a second run over the same content", () => {
    const prepared = prepare(allDocuments());
    const first = planIngest(prepared, []);
    expect(first.create).toHaveLength(prepared.length);

    const stored = prepared.map((item, i) => ({
      id: `id-${i}`,
      sourceType: item.doc.sourceType,
      slug: item.doc.slug,
      lang: item.doc.lang,
      contentHash: item.hash,
    }));
    const second = planIngest(prepare(allDocuments()), stored);
    expect(second.create).toHaveLength(0);
    expect(second.update).toHaveLength(0);
    expect(second.remove).toHaveLength(0);
    expect(second.unchanged).toBe(prepared.length);
  });

  it("updates changed documents and deletes vanished ones", () => {
    const prepared = prepare(allDocuments());
    const stored = [
      ...prepared.map((item, i) => ({
        id: `id-${i}`,
        sourceType: item.doc.sourceType,
        slug: item.doc.slug,
        lang: item.doc.lang,
        contentHash: i === 0 ? "old-hash" : item.hash,
      })),
      { id: "gone", sourceType: "repo", slug: "deleted-repo", lang: "es", contentHash: "x" },
    ];
    const plan = planIngest(prepared, stored);
    expect(plan.update.map((item) => item.id)).toEqual(["id-0"]);
    expect(plan.remove.map((item) => item.id)).toEqual(["gone"]);
  });

  it("hashes whitespace-insensitively", () => {
    const doc = allDocuments()[0];
    const chunks = chunkDocument(doc);
    const spaced = chunks.map((chunk) => ({ ...chunk, content: chunk.content.replace(/ /g, "  ") }));
    expect(contentHash(spaced)).toBe(contentHash(chunks));
  });
});
