import { describe, expect, it } from "vitest";
import {
  activeStep,
  applyEvent,
  idlePipeline,
  runningPipeline,
  timeoutPipeline,
} from "@/lib/contact/pipeline";

const run = (...steps: string[]) =>
  steps.reduce((state, step) => applyEvent(state, { step }), runningPipeline);

describe("contact pipeline", () => {
  it("advances step by step and finishes on confirmed", () => {
    expect(activeStep(runningPipeline)).toBe("received");
    const partial = run("received", "classified");
    expect(partial.done).toEqual(["received", "classified"]);
    expect(activeStep(partial)).toBe("stored");

    const done = run("received", "classified", "stored", "notified", "confirmed");
    expect(done.status).toBe("done");
    expect(activeStep(done)).toBeNull();
  });

  it("keeps pipeline order when events arrive out of order or repeat", () => {
    const state = run("stored", "received", "received", "classified");
    expect(state.done).toEqual(["received", "classified", "stored"]);
  });

  it("holds early events until every earlier step arrived", () => {
    const early = run("classified", "stored");
    expect(early.done).toEqual([]);
    expect(activeStep(early)).toBe("received");
    expect(applyEvent(early, { step: "received" }).done).toEqual([
      "received",
      "classified",
      "stored",
    ]);
  });

  it("captures intent and priority from the classified event", () => {
    const state = applyEvent(runningPipeline, {
      step: "classified",
      meta: { intent: "vacante", priority: "alta" },
    });
    expect(state.meta).toEqual({ intent: "vacante", priority: "alta" });
  });

  it("stops on a failed event and ignores later events", () => {
    const failed = run("received", "failed");
    expect(failed.status).toBe("failed");
    expect(applyEvent(failed, { step: "classified" })).toBe(failed);
  });

  it("ignores unknown steps and events while idle", () => {
    expect(run("received", "hacked").done).toEqual(["received"]);
    expect(applyEvent(idlePipeline, { step: "received" })).toBe(idlePipeline);
  });

  it("times out only while running", () => {
    expect(timeoutPipeline(run("received")).status).toBe("failed");
    const done = run("received", "classified", "stored", "notified", "confirmed");
    expect(timeoutPipeline(done)).toBe(done);
  });
});
