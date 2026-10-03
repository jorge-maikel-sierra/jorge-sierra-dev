import { createHmac, timingSafeEqual } from "node:crypto";

// HMAC-SHA256 signature for calls to the n8n webhook (docs/design.md §5).
// Header format: X-Signature: sha256=<hex>
const PREFIX = "sha256=";

export function sign(payload: string, secret: string): string {
  return PREFIX + createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

/** Constant-time comparison so the signature cannot be guessed byte by byte. */
export function verify(payload: string, signature: string, secret: string): boolean {
  const expected = Buffer.from(sign(payload, secret));
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}
