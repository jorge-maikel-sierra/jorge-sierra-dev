import { describe, expect, it } from "vitest";
import {
  checkInput,
  citationTransform,
  filterCitations,
  MAX_MESSAGE_CHARS,
  MAX_TURNS,
  redactPII,
} from "@/lib/ai/guardrails";
import { budgetKey, createBudget, estimateCost } from "@/lib/ai/cost";

describe("redactPII", () => {
  it("masks e-mails and phone numbers, keeps the rest", () => {
    expect(
      redactPII("Soy Ana (ana.perez+rh@empresa.co), llámame al +57 318 759 2616. Vacante 2025."),
    ).toBe("Soy Ana ([email]), llámame al [teléfono]. Vacante 2025.");
  });
});

describe("checkInput", () => {
  const user = (text: string) => ({ role: "user" as const, text });
  it("enforces message length and turn limits", () => {
    expect(checkInput([user("hola")])).toBeNull();
    expect(checkInput([user("   ")])).toBe("empty");
    expect(checkInput([user("x".repeat(MAX_MESSAGE_CHARS + 1))])).toBe("too_long");
    expect(checkInput(Array.from({ length: MAX_TURNS + 1 }, () => user("hola")))).toBe(
      "too_many_turns",
    );
  });
});

describe("citations", () => {
  it("removes citations to sources the model never received", () => {
    const invalid: number[] = [];
    expect(
      filterCitations("Usa NestJS [fuente:1] y Rust [fuente:7].", new Set([1, 2]), (id) =>
        invalid.push(id),
      ),
    ).toBe("Usa NestJS [fuente:1] y Rust .");
    expect(invalid).toEqual([7]);
  });

  async function stream(deltas: string[], valid: number[]) {
    const transform = citationTransform(() => new Set(valid))();
    const writer = transform.writable.getWriter();
    const out: string[] = [];
    const reading = (async () => {
      const reader = transform.readable.getReader();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value.type === "text-delta") out.push(value.text);
      }
    })();
    for (const text of deltas) await writer.write({ type: "text-delta", id: "t", text } as never);
    await writer.write({ type: "text-end", id: "t" } as never);
    await writer.close();
    await reading;
    return out.join("");
  }

  it("filters citations split across stream deltas", async () => {
    expect(await stream(["Hizo Paga Diario [fue", "nte:1] y algo ", "[fuente:9", "]."], [1])).toBe(
      "Hizo Paga Diario [fuente:1] y algo .",
    );
  });

  it("does not hold back ordinary brackets", async () => {
    expect(await stream(["Lista [a, b] y [", "x]"], [1])).toBe("Lista [a, b] y [x]");
  });
});

describe("cost", () => {
  it("prices each model's tokens", () => {
    expect(
      estimateCost([
        { model: "claude-sonnet-5-5", inputTokens: 1000, outputTokens: 500 },
        { model: "claude-haiku-4-5", inputTokens: 200, outputTokens: 10 },
      ]),
    ).toBeCloseTo(0.002 + 0.005 + 0.0002 + 0.00005);
  });

  it("closes the agent once the daily budget is spent", async () => {
    const counts = new Map<string, number>();
    const store = {
      get: async (key: string) => counts.get(key) ?? 0,
      add: async (key: string, amount: number) => {
        counts.set(key, (counts.get(key) ?? 0) + amount);
        return counts.get(key)!;
      },
    };
    const day = new Date("2026-10-03T12:00:00Z");
    const budget = createBudget(store, 0.01, () => day);
    expect(await budget.exhausted()).toBe(false);
    await budget.spend(0.006);
    expect(await budget.exhausted()).toBe(false);
    await budget.spend(0.005);
    expect(await budget.exhausted()).toBe(true);
    expect(budgetKey(day)).toBe("agent:cost:2026-10-03");
  });
});
