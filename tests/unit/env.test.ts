import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/env";

describe("parseEnv", () => {
  it("accepts an empty environment when nothing is required", () => {
    expect(parseEnv({}, []).AI_PROVIDER).toBe("anthropic");
  });

  it("fails with a clear message when a required variable is missing", () => {
    expect(() => parseEnv({}, ["SUPABASE_SERVICE_ROLE_KEY"])).toThrow(
      /SUPABASE_SERVICE_ROLE_KEY: falta y es obligatoria/,
    );
  });

  it("treats blank values as missing", () => {
    expect(() =>
      parseEnv({ N8N_WEBHOOK_SECRET: "  " }, ["N8N_WEBHOOK_SECRET"]),
    ).toThrow(/N8N_WEBHOOK_SECRET/);
  });

  it("rejects malformed values", () => {
    expect(() => parseEnv({ LANGFUSE_BASE_URL: "not-a-url" }, [])).toThrow(
      /LANGFUSE_BASE_URL/,
    );
    expect(() => parseEnv({ EMBEDDING_DIMENSIONS: "-3" }, [])).toThrow(
      /EMBEDDING_DIMENSIONS/,
    );
  });

  it("coerces numeric values", () => {
    const env = parseEnv(
      { EMBEDDING_DIMENSIONS: "1536", AGENT_DAILY_BUDGET_USD: "2.5" },
      [],
    );
    expect(env.EMBEDDING_DIMENSIONS).toBe(1536);
    expect(env.AGENT_DAILY_BUDGET_USD).toBe(2.5);
  });
});
