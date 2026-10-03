import { contactSchema, type ContactErrors, type ContactInput } from "./schema";

// Use case behind POST /api/contact (docs/design.md §5). Infrastructure is
// injected, so every branch is covered by unit tests without network.

export const HONEYPOT_FIELD = "website";

export type ContactDeps = {
  /** Sliding window per IP: 5 submissions every 10 minutes. */
  limit(ip: string): Promise<{ success: boolean; reset: number }>;
  verifyTurnstile(token: string, ip: string | null): Promise<boolean>;
  /** Inserts the lead and its "received" event; returns the new lead id. */
  store(input: ContactInput): Promise<string>;
  /** Signed call to the n8n webhook. */
  notify(payload: ContactInput & { leadId: string }): Promise<void>;
  /** Records a "failed" event so the browser shows the reassuring message. */
  recordFailure(leadId: string, failedStep: string): Promise<void>;
  /** Runs work after the response is sent (next/server `after`). */
  defer(task: () => Promise<void>): void;
  newId(): string;
  now(): number;
};

export type ContactResult =
  | { status: 200; body: { leadId: string } }
  | { status: 400; body: { error: "invalid"; field: string; message: string } }
  | { status: 403; body: { error: "captcha" } }
  | { status: 429; body: { error: "rate_limited"; retryAfter: number } }
  | { status: 500; body: { error: "store_failed" } };

const FIELD_ORDER = ["name", "email", "company", "message", "kind"];

export async function submitContact(
  raw: unknown,
  ip: string | null,
  deps: ContactDeps,
  errors: ContactErrors,
): Promise<ContactResult> {
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  // Bots fill every field. Answer like a success, store nothing.
  if (typeof body[HONEYPOT_FIELD] === "string" && body[HONEYPOT_FIELD].trim()) {
    return { status: 200, body: { leadId: deps.newId() } };
  }

  const limited = await deps.limit(ip ?? "unknown");
  if (!limited.success) {
    const retryAfter = Math.max(1, Math.ceil((limited.reset - deps.now()) / 1000));
    return { status: 429, body: { error: "rate_limited", retryAfter } };
  }

  const parsed = contactSchema(errors).safeParse(body);
  if (!parsed.success) {
    const issue = FIELD_ORDER.map((field) =>
      parsed.error.issues.find((item) => item.path[0] === field),
    ).find(Boolean) ?? parsed.error.issues[0];
    return {
      status: 400,
      body: { error: "invalid", field: String(issue.path[0] ?? ""), message: issue.message },
    };
  }

  const token = typeof body.turnstileToken === "string" ? body.turnstileToken : "";
  if (!token || !(await deps.verifyTurnstile(token, ip))) {
    return { status: 403, body: { error: "captcha" } };
  }

  let leadId: string;
  try {
    leadId = await deps.store(parsed.data);
  } catch {
    return { status: 500, body: { error: "store_failed" } };
  }

  // The browser already has its lead id: n8n runs after the response.
  deps.defer(async () => {
    try {
      await deps.notify({ ...parsed.data, leadId });
    } catch {
      await deps.recordFailure(leadId, "webhook").catch(() => undefined);
    }
  });

  return { status: 200, body: { leadId } };
}
