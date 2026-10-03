import type { KbDocument } from "./sources";
import { estimateTokens } from "./text";

// docs/agent-spec.md §4: one chunk per JSON entity (split by section above 800
// tokens); markdown by headings, then ~600-token windows with 80 of overlap.
export const MAX_ENTITY_TOKENS = 800;
export const WINDOW_TOKENS = 600;
export const OVERLAP_TOKENS = 80;

export type KbChunk = {
  index: number;
  /** Starts with a context header so the embedding keeps "what this is about". */
  content: string;
  metadata: {
    source_type: KbDocument["sourceType"];
    slug: string;
    title: string;
    url: string | null;
    lang: string;
    section: string;
  };
};

const header = (doc: KbDocument, sectionName: string) =>
  `# ${doc.title}${sectionName ? ` — ${sectionName}` : ""}`;

/** Splits text into overlapping windows, cutting at whitespace. */
export function windows(text: string, size = WINDOW_TOKENS, overlap = OVERLAP_TOKENS) {
  const maxChars = size * 4;
  const overlapChars = overlap * 4;
  if (text.length <= maxChars) return [text];

  const parts: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(text.length, start + maxChars);
    if (end < text.length) {
      const cut = text.lastIndexOf(" ", end);
      if (cut > start + maxChars / 2) end = cut;
    }
    parts.push(text.slice(start, end).trim());
    if (end >= text.length) break;
    const next = text.indexOf(" ", end - overlapChars);
    start = next > start && next < end ? next + 1 : end;
  }
  return parts;
}

function markdownSections(markdown: string) {
  const sections: { name: string; text: string }[] = [];
  let current = { name: "", lines: [] as string[] };
  for (const line of markdown.split("\n")) {
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      if (current.lines.join("").trim()) {
        sections.push({ name: current.name, text: current.lines.join("\n").trim() });
      }
      current = { name: heading[1].trim(), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.lines.join("").trim()) {
    sections.push({ name: current.name, text: current.lines.join("\n").trim() });
  }
  return sections;
}

export function chunkDocument(doc: KbDocument): KbChunk[] {
  const pieces: { section: string; text: string }[] = [];

  if (doc.sections) {
    const whole = doc.sections.map((s) => `## ${s.name}\n${s.text}`).join("\n\n");
    if (estimateTokens(whole) <= MAX_ENTITY_TOKENS) {
      pieces.push({ section: "", text: whole });
    } else {
      for (const s of doc.sections) {
        for (const part of windows(s.text)) pieces.push({ section: s.name, text: part });
      }
    }
  } else if (doc.markdown) {
    for (const s of markdownSections(doc.markdown)) {
      for (const part of windows(s.text)) pieces.push({ section: s.name, text: part });
    }
  }

  return pieces
    .filter((piece) => piece.text.trim())
    .map((piece, index) => ({
      index,
      content: `${header(doc, piece.section)}\n${piece.text}`,
      metadata: {
        source_type: doc.sourceType,
        slug: doc.slug,
        title: doc.title,
        url: doc.url,
        lang: doc.lang,
        section: piece.section,
      },
    }));
}
