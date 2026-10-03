import { sign } from "@/lib/hmac";

// Signed call to the n8n contact webhook (docs/design.md §5, task 3.3).
export function createN8nNotifier(webhookUrl: string, secret: string) {
  return async (payload: object) => {
    const body = JSON.stringify(payload);
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Signature": sign(body, secret) },
      body,
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`n8n responded ${response.status}`);
  };
}
