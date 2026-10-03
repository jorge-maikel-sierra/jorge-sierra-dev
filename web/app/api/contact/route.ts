import { after } from "next/server";
import { createN8nNotifier } from "@/lib/contact/n8n";
import { createLeadStore } from "@/lib/contact/store";
import { submitContact } from "@/lib/contact/submit";
import { createTurnstileVerifier } from "@/lib/contact/turnstile";
import { CONTACT_ENV, N8N_ENV, pickEnv } from "@/lib/env";
import { getMessages } from "@/lib/messages";
import { createContactLimiter } from "@/lib/ratelimit";
import { createServiceClient } from "@/lib/supabase/server";

const MAX_BODY_BYTES = 16 * 1024;

const clientIp = (request: Request) =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  request.headers.get("x-real-ip");

export async function POST(request: Request) {
  const config = pickEnv(CONTACT_ENV);
  if (!config) return Response.json({ error: "unavailable" }, { status: 503 });

  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return Response.json({ error: "too_large" }, { status: 413 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const n8n = pickEnv(N8N_ENV);
  const leads = createLeadStore(
    createServiceClient(config.NEXT_PUBLIC_SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY),
  );

  const result = await submitContact(
    raw,
    clientIp(request),
    {
      limit: createContactLimiter(
        config.UPSTASH_REDIS_REST_URL,
        config.UPSTASH_REDIS_REST_TOKEN,
      ),
      verifyTurnstile: createTurnstileVerifier(config.TURNSTILE_SECRET_KEY),
      store: leads.store,
      notify: n8n
        ? createN8nNotifier(n8n.N8N_CONTACT_WEBHOOK_URL, n8n.N8N_WEBHOOK_SECRET)
        : null,
      recordFailure: leads.recordFailure,
      defer: (task) => after(task),
      newId: () => crypto.randomUUID(),
      now: Date.now,
    },
    getMessages("es").contact.errors,
  );

  return Response.json(result.body, {
    status: result.status,
    headers:
      result.status === 429 ? { "Retry-After": String(result.body.retryAfter) } : undefined,
  });
}
