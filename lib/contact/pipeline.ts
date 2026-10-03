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
  /** Steps whose event arrived, in any order. */
  reached: PipelineStep[];
  /** Steps shown as done: only an unbroken prefix of the pipeline. */
  done: PipelineStep[];
  meta: { intent?: string; priority?: string };
};

/** After this long without "confirmed", show the reassuring message (§5). */
export const PIPELINE_TIMEOUT_MS = 20_000;

export const idlePipeline: PipelineState = { status: "idle", reached: [], done: [], meta: {} };
export const runningPipeline: PipelineState = {
  status: "running",
  reached: [],
  done: [],
  meta: {},
};

const isStep = (step: string): step is PipelineStep =>
  (PIPELINE_STEPS as readonly string[]).includes(step);

const text = (value: unknown) => (typeof value === "string" ? value : undefined);

/**
 * Events may repeat or arrive out of order (Realtime vs. the initial read).
 * A step is shown as done only once every earlier step arrived, so the
 * visitor always sees the pipeline advance in order.
 */
export function applyEvent(state: PipelineState, event: LeadEvent): PipelineState {
  if (state.status !== "running") return state;
  if (event.step === "failed") return { ...state, status: "failed" };
  if (!isStep(event.step) || state.reached.includes(event.step)) return state;

  const reached = [...state.reached, event.step];
  const gap = PIPELINE_STEPS.findIndex((step) => !reached.includes(step));
  const done = gap === -1 ? [...PIPELINE_STEPS] : PIPELINE_STEPS.slice(0, gap);
  const meta =
    event.step === "classified"
      ? { intent: text(event.meta?.intent), priority: text(event.meta?.priority) }
      : state.meta;

  return {
    status: done.includes("confirmed") ? "done" : "running",
    reached,
    done,
    meta,
  };
}

export function timeoutPipeline(state: PipelineState): PipelineState {
  return state.status === "running" ? { ...state, status: "failed" } : state;
}

/** The step currently being processed, if any. */
export function activeStep(state: PipelineState): PipelineStep | null {
  if (state.status !== "running") return null;
  return PIPELINE_STEPS.find((step) => !state.done.includes(step)) ?? null;
}
