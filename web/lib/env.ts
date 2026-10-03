import { z } from "zod";

// Empty values in .env files ("FOO=") count as missing.
const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const text = z.preprocess(blankToUndefined, z.string().trim().optional());
const url = z.preprocess(blankToUndefined, z.url().optional());
const positiveInt = z.preprocess(
  blankToUndefined,
  z.coerce.number().int().positive().optional(),
);
const positiveNumber = z.preprocess(
  blankToUndefined,
  z.coerce.number().positive().optional(),
);

// docs/design.md §9
export const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: url,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: text,
  SUPABASE_SERVICE_ROLE_KEY: text,

  AI_PROVIDER: z.preprocess(blankToUndefined, z.string().default("anthropic")),
  AI_MODEL: text,
  ANTHROPIC_API_KEY: text,

  EMBEDDING_PROVIDER: text,
  EMBEDDING_MODEL: text,
  EMBEDDING_DIMENSIONS: positiveInt,
  EMBEDDING_API_KEY: text,

  UPSTASH_REDIS_REST_URL: url,
  UPSTASH_REDIS_REST_TOKEN: text,
  AGENT_DAILY_BUDGET_USD: positiveNumber,

  LANGFUSE_PUBLIC_KEY: text,
  LANGFUSE_SECRET_KEY: text,
  LANGFUSE_HOST: url,

  N8N_CONTACT_WEBHOOK_URL: url,
  N8N_WEBHOOK_SECRET: text,

  TURNSTILE_SECRET_KEY: text,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: text,

  GITHUB_TOKEN: text,
  CAL_BOOKING_URL: url,
});

export type Env = z.infer<typeof envSchema>;
export type EnvKey = keyof Env;

/**
 * Variables become required in the phase that starts using them, so the
 * site can run before every external account exists.
 * - Phase 3 (contact): Supabase, n8n and Turnstile variables.
 * - Phase 4 (agent): AI, embeddings, Upstash and Langfuse variables.
 */
export const REQUIRED_ENV: readonly EnvKey[] = [];

export function parseEnv(
  source: Record<string, string | undefined>,
  required: readonly EnvKey[] = REQUIRED_ENV,
): Env {
  const result = envSchema.safeParse(source);
  const problems: string[] = result.success
    ? []
    : result.error.issues.map(
        (issue) => `  - ${issue.path.join(".")}: ${issue.message}`,
      );

  const values = result.success ? result.data : undefined;
  for (const key of required) {
    if (values?.[key] === undefined && blankToUndefined(source[key]) === undefined) {
      problems.push(`  - ${key}: falta y es obligatoria`);
    }
  }

  if (problems.length > 0 || !values) {
    throw new Error(
      [
        "Variables de entorno inválidas:",
        ...problems,
        "Revisa web/.env.example y define los valores en web/.env.local o en Vercel.",
      ].join("\n"),
    );
  }

  return values;
}

export const env = parseEnv(process.env);

/** Variables the contact pipeline needs (tasks 3.2–3.4). */
export const CONTACT_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "TURNSTILE_SECRET_KEY",
  "N8N_CONTACT_WEBHOOK_URL",
  "N8N_WEBHOOK_SECRET",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const satisfies readonly EnvKey[];

/** Returns the requested variables only when every one of them is set. */
export function pickEnv<K extends EnvKey>(
  keys: readonly K[],
  source: Env = env,
): { [P in K]: NonNullable<Env[P]> } | null {
  const picked = {} as { [P in K]: NonNullable<Env[P]> };
  for (const key of keys) {
    const value = source[key];
    if (value === undefined) return null;
    picked[key] = value as NonNullable<Env[K]>;
  }
  return picked;
}
