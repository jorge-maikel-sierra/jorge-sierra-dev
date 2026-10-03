import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { randomInt } from "node:crypto";
import { expect, test } from "@playwright/test";
import { verify } from "@/lib/hmac";

// Tasks 3.2 and 3.4 against real Supabase (Realtime) and Upstash, with a fake
// n8n that checks the HMAC signature and writes the pipeline events.

function localEnv(): Record<string, string> {
  try {
    return Object.fromEntries(
      readFileSync(".env.local", "utf8")
        .split("\n")
        .filter((line) => /^[A-Z_]+=/.test(line))
        .map((line) => {
          const at = line.indexOf("=");
          return [line.slice(0, at), line.slice(at + 1).replace(/^"|"$/g, "")];
        }),
    );
  } catch {
    return {};
  }
}

const env = localEnv();
const ready = Boolean(
  env.NEXT_PUBLIC_SUPABASE_URL &&
    env.SUPABASE_SERVICE_ROLE_KEY &&
    env.UPSTASH_REDIS_REST_URL &&
    env.UPSTASH_REDIS_REST_TOKEN,
);
const SECRET = "e2e-webhook-secret";
const NAME = "E2E Test";

test.describe.configure({ mode: "serial" });
test.skip(!ready, "needs Supabase and Upstash keys in .env.local");
// One fake n8n on a fixed port: run once, on desktop (the pipeline is the same).
test.skip(({ isMobile }) => isMobile, "runs once, on desktop");

const db = ready
  ? createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })
  : null;

type Received = { signatureOk: boolean; body: Record<string, unknown> };
const received: Received[] = [];
let server: Server | undefined;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const fakeIp = () => `10.${randomInt(255)}.${randomInt(255)}.${randomInt(1, 255)}`;

test.beforeAll(async ({}, testInfo) => {
  // Skipped tests still run beforeAll: only the desktop worker owns port 3401.
  if (!ready || testInfo.project.name !== "desktop") return;
  server = createServer((request, response) => {
    let raw = "";
    request.on("data", (chunk) => (raw += chunk));
    request.on("end", async () => {
      const signatureOk = verify(raw, String(request.headers["x-signature"] ?? ""), SECRET);
      const body = JSON.parse(raw) as Record<string, unknown>;
      received.push({ signatureOk, body });
      response.writeHead(signatureOk ? 200 : 401).end();
      if (!signatureOk || !db) return;

      // What the n8n workflow (task 3.3) does, one event per step.
      const leadId = String(body.leadId);
      for (const [step, meta] of [
        ["classified", { intent: String(body.kind), priority: "alta" }],
        ["stored", {}],
        ["notified", {}],
        ["confirmed", {}],
      ] as const) {
        await wait(250);
        await db.from("lead_events").insert({ lead_id: leadId, step, meta });
      }
    });
  });
  await new Promise<void>((resolve) => server!.listen(3401, "127.0.0.1", resolve));
});

test.afterAll(async () => {
  if (server) await new Promise((resolve) => server!.close(resolve));
  await db?.from("leads").delete().like("name", `${NAME}%`);
});

test("a real submission lights the five steps in order through Realtime", async ({
  page,
}) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": fakeIp() });
  await page.goto("/es#contacto");

  const form = page.locator("#contacto form");
  await form.getByRole("button", { name: "Un proyecto" }).click();
  await form.getByLabel("Nombre").fill(`${NAME} UI`);
  await form.getByLabel("Correo").fill("e2e@example.com");
  await form.getByLabel("Mensaje").fill("Prueba automática del pipeline");
  await form.getByRole("button", { name: "Enviar mensaje" }).click();

  const steps = page.locator("[data-step]");
  const order: string[] = [];
  await expect
    .poll(
      async () => {
        const states = await steps.evaluateAll((items) =>
          items.map((item) => `${item.getAttribute("data-step")}:${item.getAttribute("data-state")}`),
        );
        for (const entry of states) {
          const [step, state] = entry.split(":");
          if (state === "done" && !order.includes(step)) order.push(step);
        }
        return order.length;
      },
      { timeout: 15_000, intervals: [100] },
    )
    .toBe(5);

  expect(order).toEqual(["received", "classified", "stored", "notified", "confirmed"]);
  await expect(page.getByText("Listo. Te respondo personalmente pronto.")).toBeVisible();
  await expect(page.getByText("Intención: proyecto · prioridad alta")).toBeVisible();
  await expect(page.getByText("Confirmación enviada a e2e@example.com")).toBeVisible();

  // Other suites may submit in parallel: find this test's own webhook call.
  const call = received.find((entry) => entry.body.name === `${NAME} UI`);
  expect(call?.signatureOk).toBe(true);
  expect(call?.body).toMatchObject({ kind: "proyecto", email: "e2e@example.com" });
});

test("the API stores the lead and its received event", async ({ request }) => {
  const response = await request.post("/api/contact", {
    headers: { "x-forwarded-for": fakeIp() },
    data: {
      kind: "vacante",
      name: `${NAME} API`,
      email: "e2e@example.com",
      message: "Prueba de la API",
      turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
    },
  });
  expect(response.status()).toBe(200);
  const { leadId } = (await response.json()) as { leadId: string };

  const { data: lead } = await db!.from("leads").select("kind, name").eq("id", leadId).single();
  expect(lead).toEqual({ kind: "vacante", name: `${NAME} API` });
  const { data: events } = await db!.from("lead_events").select("step").eq("lead_id", leadId);
  expect(events?.map((event) => event.step)).toContain("received");
});

test("the sixth submission from one IP in 10 minutes is rate limited", async ({
  request,
}) => {
  const ip = fakeIp();
  const statuses: number[] = [];
  for (let i = 0; i < 6; i++) {
    const response = await request.post("/api/contact", {
      headers: { "x-forwarded-for": ip },
      data: {
        kind: "otro",
        name: `${NAME} limit ${i}`,
        email: "e2e@example.com",
        message: "Prueba de rate limit",
        turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
      },
    });
    statuses.push(response.status());
    if (response.status() === 429) {
      expect(Number(response.headers()["retry-after"])).toBeGreaterThan(0);
    }
  }
  expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
});

test("the honeypot answers like a success and stores nothing", async ({ request }) => {
  const response = await request.post("/api/contact", {
    headers: { "x-forwarded-for": fakeIp() },
    data: {
      kind: "otro",
      name: `${NAME} bot`,
      email: "bot@example.com",
      message: "spam",
      website: "http://spam.example",
      turnstileToken: "XXXX.DUMMY.TOKEN.XXXX",
    },
  });
  expect(response.status()).toBe(200);
  const { count } = await db!
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("name", `${NAME} bot`);
  expect(count).toBe(0);
});
