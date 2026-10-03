import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// RF-5.3: 5 contact submissions per IP every 10 minutes.
export const CONTACT_LIMIT = { requests: 5, window: "10 m" } as const;

export function createContactLimiter(url: string, token: string) {
  const limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(CONTACT_LIMIT.requests, CONTACT_LIMIT.window),
    prefix: "ratelimit:contact",
  });
  return async (ip: string) => {
    const { success, reset } = await limiter.limit(ip);
    return { success, reset };
  };
}
