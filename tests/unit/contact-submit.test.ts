import { describe, expect, it, vi } from "vitest";
import { HONEYPOT_FIELD, submitContact, type ContactDeps } from "@/lib/contact/submit";
import { pickEnv } from "@/lib/env";
import { sign, verify } from "@/lib/hmac";
import { CONTACT_LIMIT } from "@/lib/ratelimit";

const errors = { name: "NAME", email: "EMAIL", message: "MESSAGE", tooLong: "TOO_LONG" };
const valid = {
  kind: "proyecto",
  name: "Ana",
  email: "ana@empresa.com",
  company: "Acme",
  message: "Facturamos a mano",
  turnstileToken: "token-ok",
};

function fakeDeps(overrides: Partial<ContactDeps> = {}) {
  const deferred: (() => Promise<void>)[] = [];
  const deps: ContactDeps = {
    limit: vi.fn(async () => ({ success: true, reset: 0 })),
    verifyTurnstile: vi.fn(async () => true),
    store: vi.fn(async () => "lead-1"),
    notify: vi.fn(async () => undefined),
    recordFailure: vi.fn(async () => undefined),
    defer: (task) => {
      deferred.push(task);
    },
    newId: () => "random-id",
    now: () => 1_000_000,
    ...overrides,
  };
  const flush = () => Promise.all(deferred.map((task) => task()));
  return { deps, flush };
}

describe("HMAC signature", () => {
  const secret = "s3cret";
  const body = JSON.stringify({ leadId: "lead-1" });

  it("signs with the sha256= prefix and verifies its own signature", () => {
    const signature = sign(body, secret);
    expect(signature).toMatch(/^sha256=[0-9a-f]{64}$/);
    expect(verify(body, signature, secret)).toBe(true);
  });

  it("rejects a tampered body, a wrong secret and malformed signatures", () => {
    const signature = sign(body, secret);
    expect(verify(body.replace("1", "2"), signature, secret)).toBe(false);
    expect(verify(body, signature, "other")).toBe(false);
    expect(verify(body, "sha256=abc", secret)).toBe(false);
    expect(verify(body, "", secret)).toBe(false);
  });
});

describe("rate limit", () => {
  it("allows 5 submissions per IP every 10 minutes (RF-5.3)", () => {
    expect(CONTACT_LIMIT).toEqual({ requests: 5, window: "10 m" });
  });

  it("answers 429 with Retry-After seconds and stores nothing", async () => {
    const { deps } = fakeDeps({
      limit: vi.fn(async () => ({ success: false, reset: 1_000_000 + 42_500 })),
    });
    const result = await submitContact(valid, "1.2.3.4", deps, errors);
    expect(result).toEqual({ status: 429, body: { error: "rate_limited", retryAfter: 43 } });
    expect(deps.limit).toHaveBeenCalledWith("1.2.3.4");
    expect(deps.store).not.toHaveBeenCalled();
  });
});

describe("submitContact", () => {
  it("returns a fake success for bots that fill the honeypot", async () => {
    const { deps } = fakeDeps();
    const result = await submitContact(
      { ...valid, [HONEYPOT_FIELD]: "http://spam" },
      "1.2.3.4",
      deps,
      errors,
    );
    expect(result).toEqual({ status: 200, body: { leadId: "random-id" } });
    expect(deps.limit).not.toHaveBeenCalled();
    expect(deps.store).not.toHaveBeenCalled();
  });

  it("validates with the shared schema and reports the first field", async () => {
    const { deps } = fakeDeps();
    const result = await submitContact({ ...valid, email: "ana@" }, null, deps, errors);
    expect(result).toEqual({
      status: 400,
      body: { error: "invalid", field: "email", message: "EMAIL" },
    });
    expect(deps.verifyTurnstile).not.toHaveBeenCalled();
  });

  it("rejects missing or failed Turnstile tokens", async () => {
    const missing = fakeDeps();
    expect(
      await submitContact({ ...valid, turnstileToken: "" }, null, missing.deps, errors),
    ).toEqual({ status: 403, body: { error: "captcha" } });

    const failed = fakeDeps({ verifyTurnstile: vi.fn(async () => false) });
    expect(await submitContact(valid, "9.9.9.9", failed.deps, errors)).toEqual({
      status: 403,
      body: { error: "captcha" },
    });
    expect(failed.deps.verifyTurnstile).toHaveBeenCalledWith("token-ok", "9.9.9.9");
    expect(failed.deps.store).not.toHaveBeenCalled();
  });

  it("answers 500 when the lead cannot be stored", async () => {
    const { deps } = fakeDeps({ store: vi.fn(async () => Promise.reject(new Error("db"))) });
    expect(await submitContact(valid, null, deps, errors)).toEqual({
      status: 500,
      body: { error: "store_failed" },
    });
  });

  it("stores the lead, answers with its id and notifies n8n after responding", async () => {
    const { deps, flush } = fakeDeps();
    const result = await submitContact(valid, "1.2.3.4", deps, errors);

    expect(result).toEqual({ status: 200, body: { leadId: "lead-1" } });
    expect(deps.store).toHaveBeenCalledWith({
      kind: "proyecto",
      name: "Ana",
      email: "ana@empresa.com",
      company: "Acme",
      message: "Facturamos a mano",
    });
    // Nothing reached n8n before the response.
    expect(deps.notify).not.toHaveBeenCalled();

    await flush();
    expect(deps.notify).toHaveBeenCalledWith(
      expect.objectContaining({ leadId: "lead-1", kind: "proyecto" }),
    );
    expect(deps.recordFailure).not.toHaveBeenCalled();
  });

  it("records a failed event when n8n cannot be reached", async () => {
    const { deps, flush } = fakeDeps({
      notify: vi.fn(async () => Promise.reject(new Error("timeout"))),
    });
    await submitContact(valid, null, deps, errors);
    await flush();
    expect(deps.recordFailure).toHaveBeenCalledWith("lead-1", "webhook");
  });
});

describe("without n8n configured", () => {
  it("stores the lead and schedules nothing else", async () => {
    const { deps } = fakeDeps({ notify: null });
    const defer = vi.fn();
    const result = await submitContact(valid, null, { ...deps, defer }, errors);
    expect(result).toEqual({ status: 200, body: { leadId: "lead-1" } });
    expect(defer).not.toHaveBeenCalled();
  });
});

describe("pickEnv", () => {
  it("returns the values only when every key is present", () => {
    expect(pickEnv(["AI_PROVIDER"], { AI_PROVIDER: "anthropic" })).toEqual({
      AI_PROVIDER: "anthropic",
    });
    expect(
      pickEnv(["AI_PROVIDER", "AI_MODEL"], { AI_PROVIDER: "anthropic" }),
    ).toBeNull();
  });
});
