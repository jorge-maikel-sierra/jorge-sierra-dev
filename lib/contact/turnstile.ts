const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Cloudflare Turnstile server-side check (RF-5.3).
export function createTurnstileVerifier(secret: string) {
  return async (token: string, ip: string | null) => {
    const form = new URLSearchParams({ secret, response: token });
    if (ip) form.set("remoteip", ip);
    try {
      const response = await fetch(SITEVERIFY, {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(5000),
      });
      const result = (await response.json()) as { success?: boolean };
      return result.success === true;
    } catch {
      return false;
    }
  };
}
