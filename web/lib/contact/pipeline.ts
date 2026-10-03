// State of the visible contact pipeline, driven only by real rows in
// lead_events (RF-5.2: no timers pretending to be steps).

export const PIPELINE_STEPS = [
  "received",
  "classified",
  "stored",
  "notified",
  "confirmed",
] as const;
export type PipelineStep = (typeof PIPELINE_STEPS)[number];

export type LeadEvent = { step: string; meta?: Record<string, unknown> | null };

export type PipelineState = {
  status: "idle" | "running" | "done" | "failed";
  done: PipelineStep[];
  meta: { intent?: string; priority?: string };
};

/** After this long without "confirmed", show the reassuring message (§5). */
export const PIPELINE_TIMEOUT_MS = 20_000;

export const idlePipeline: PipelineState = { status: "idle", done: [], meta: {} };
export const runningPipeline: PipelineState = { status: "running", done: [], meta: {} };

const isStep = (step: string): step is PipelineStep =>
  (PIPELINE_STEPS as readonly string[]).includes(step);

const text = (value: unknown) => (typeof value === "string" ? value : undefined);

/** Events may repeat or arrive out of order; steps are kept in pipeline order. */
export function applyEvent(state: PipelineState, event: LeadEvent): PipelineState {
  if (state.status !== "running") return state;
  if (event.step === "failed") return { ...state, status: "failed" };
  if (!isStep(event.step) || state.done.includes(event.step)) return state;

  const reached = new Set<PipelineStep>([...state.done, event.step]);
  const done = PIPELINE_STEPS.filter((step) => reached.has(step));
  const meta =
    event.step === "classified"
      ? { intent: text(event.meta?.intent), priority: text(event.meta?.priority) }
      : state.meta;

  return { status: reached.has("confirmed") ? "done" : "running", done, meta };
}

export function timeoutPipeline(state: PipelineState): PipelineState {
  return state.status === "running" ? { ...state, status: "failed" } : state;
}

/** The step currently being processed, if any. */
export function activeStep(state: PipelineState): PipelineStep | null {
  if (state.status !== "running") return null;
  return PIPELINE_STEPS.find((step) => !state.done.includes(step)) ?? null;
}
