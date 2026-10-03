import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// RF-5.3: 5 contact submissions per IP every 10 minutes.
export const CONTACT_LIMIT = { requests: 5, window: "10 m" } as const;

/** docs/agent-spec.md §3: 10 agent messages per IP every 10 minutes. */
export const AGENT_LIMIT = { requests: 10, window: "10 m" } as const;

function createLimiter(
  url: string,
  token: string,
  config: { requests: number; window: `${number} m` },
  prefix: string,
) {
  const limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(config.requests, config.window),
    prefix,
  });
  return async (ip: string) => {
    const { success, reset } = await limiter.limit(ip);
    return { success, reset };
  };
}

export const createContactLimiter = (url: string, token: string) =>
  createLimiter(url, token, CONTACT_LIMIT, "ratelimit:contact");

export const createAgentLimiter = (url: string, token: string) =>
  createLimiter(url, token, AGENT_LIMIT, "ratelimit:agent");
