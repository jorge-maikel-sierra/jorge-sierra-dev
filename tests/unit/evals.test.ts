import { describe, expect, it } from "vitest";
import {
  citationScore,
  countMalformedCitations,
  phraseHits,
  recallAt8,
  summarize,
  THRESHOLDS,
} from "@/evals/judges";

describe("phraseHits", () => {
  it("matches whole words, ignoring case and accents", () => {
    const text = "Trabajó en escuelas y consolas. Tecnólogo del SENA.";
    expect(phraseHits(text, ["olas", "tecnologo", "sena"])).toEqual(["tecnologo", "sena"]);
  });

  it("matches symbols and multi-word phrases", () => {
    expect(phraseHits("Cobra $50 USD por hora", ["$", "usd", "por hora", "COP"])).toEqual([
      "$",
      "usd",
      "por hora",
    ]);
  });
});

describe("citationScore", () => {
  const run = (valid: number, invalid = 0, malformed = 0) => ({
    validCitations: valid,
    invalidCitations: invalid,
    malformedCitations: malformed,
  });

  it("counts markers in the wrong format as citations that resolve nowhere", () => {
    const text = "Usa NestJS [5]. Trabajó con Supabase [2][4].";
    expect(countMalformedCitations(text)).toBe(3);
    expect(countMalformedCitations("Usa NestJS [fuente:5].")).toBe(0);
    expect(citationScore(run(1, 0, 3), { mustCite: true })).toBe(0.25);
  });

  it("an answer about Jorge with no valid citation scores 0", () => {
    expect(citationScore(run(0, 0, 4), { mustCite: true })).toBe(0);
    expect(citationScore(run(0), { mustCite: false })).toBe(1);
    expect(citationScore(run(3, 1), { mustCite: true })).toBe(0.75);
  });
});

describe("recall and thresholds", () => {
  it("recall@8 only looks at the first 8 retrieved sources", () => {
    const retrieved = ["a", "b", "c", "d", "e", "f", "g", "h", "case:x"];
    expect(recallAt8(["a", "case:x"], retrieved)).toBe(0.5);
    expect(recallAt8([], retrieved)).toBe(1);
  });

  it("fails a metric below its threshold and tolerates float noise", () => {
    const rows = summarize({
      faithfulness: [0.9, 0.9, 0.9],
      recall: [1, 0.5],
      refusal: [1, 1, 0],
      citations: [1],
      gaps: [],
    });
    const byMetric = Object.fromEntries(rows.map((row) => [row.metric, row.passed]));
    expect(byMetric).toEqual({
      faithfulness: true,
      recall: false,
      refusal: false,
      citations: true,
      gaps: true,
    });
    expect(rows.find((row) => row.metric === "refusal")?.threshold).toBe(THRESHOLDS.refusal);
  });
});
