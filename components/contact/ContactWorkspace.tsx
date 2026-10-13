"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  applyEvent,
  idlePipeline,
  PIPELINE_TIMEOUT_MS,
  runningPipeline,
  timeoutPipeline,
  type PipelineState,
} from "@/lib/contact/pipeline";
import type { Messages } from "@/lib/messages";
import { ContactForm } from "./ContactForm";
import { PipelineView } from "./PipelineView";

// Owns one submission at a time: the form posts it, PipelineView shows the
// real lead_events arriving through Supabase Realtime (task 3.4).
const ramp = (value: number, from: number, to: number) =>
  Math.min(1, Math.max(0, (value - from) / (to - from)));

// The contact screen is pinned: scrolling reveals the glass cards (form first,
// then the pipeline, then the direct channels). Beside each other from 900 px,
// one at a time (crossfading in the same spot) on phones. Without motion
// everything is simply there.
export function ContactWorkspace({
  t,
  heading,
  channels,
}: {
  t: Messages["contact"];
  heading: ReactNode;
  channels: ReactNode;
}) {
  const [pipeline, setPipeline] = useState<PipelineState>(idlePipeline);
  const [sender, setSender] = useState<{ name: string; email: string } | null>(null);
  const [formKey, setFormKey] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const goTo = useRef<((stage: "form" | "pipeline" | "channels") => void) | null>(null);
  const stop = useRef<(() => void) | null>(null);
  const timer = useRef<number | null>(null);

  const cleanup = () => {
    stop.current?.();
    stop.current = null;
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };

  // Stop listening once the pipeline finished or failed.
  useEffect(() => {
    if (pipeline.status === "done" || pipeline.status === "failed") cleanup();
  }, [pipeline.status]);

  useEffect(() => cleanup, []);

  useEffect(() => {
    const section = root.current;
    const sticky = box.current;
    if (!section || !sticky) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const slots = {
      form: section.querySelector<HTMLElement>('[data-slot="form"]')!,
      pipeline: section.querySelector<HTMLElement>('[data-slot="pipeline"]')!,
      channels: section.querySelector<HTMLElement>('[data-slot="channels"]')!,
    };
    const wide = window.matchMedia("(min-width: 900px)");
    let distance = 1;

    section.dataset.pinned = "";
    sticky.style.cssText = "position:sticky;top:0;height:max(100svh,600px)";

    // Where each stage is fully in view, as a fraction of the pinned travel.
    const at = () => ({ form: 0, pipeline: wide.matches ? 0.5 : 0.5, channels: 1 });

    const apply = (slot: HTMLElement, r: number, transform: string) => {
      slot.style.opacity = String(r);
      slot.style.transform = transform;
      slot.style.pointerEvents = r < 0.5 ? "none" : "";
      slot.toggleAttribute("data-cf-inactive", r < 0.5);
    };

    const render = () => {
      const p = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / distance));
      if (wide.matches) {
        const pipeline = ramp(p, 0.08, 0.45);
        const channelsIn = ramp(p, 0.5, 0.9);
        apply(slots.form, 1, "");
        apply(slots.pipeline, pipeline, `translateX(${(1 - pipeline) * 56}px)`);
        apply(slots.channels, channelsIn, `translateY(${(1 - channelsIn) * 44}px)`);
      } else {
        // While typing, the browser may nudge the page (keyboard, focus
        // scrolling): the form must not fade out under the visitor's fingers.
        const active = document.activeElement;
        const typing = active instanceof HTMLElement && slots.form.contains(active) && active.matches("input, textarea");
        const form = typing ? 1 : 1 - ramp(p, 0.18, 0.32);
        const pipeline = typing ? 0 : ramp(p, 0.25, 0.4) * (1 - ramp(p, 0.62, 0.76));
        const channelsIn = typing ? 0 : ramp(p, 0.68, 0.82);
        apply(slots.form, form, `translateY(${(1 - form) * -24}px)`);
        apply(slots.pipeline, pipeline, `translateY(${(1 - pipeline) * 28}px) scale(${0.97 + 0.03 * pipeline})`);
        apply(slots.channels, channelsIn, `translateY(${(1 - channelsIn) * 28}px)`);
      }
    };

    const layout = () => {
      if (wide.matches) delete section.dataset.stack;
      else section.dataset.stack = "";
      distance = Math.max(1, window.innerHeight * (wide.matches ? 1.2 : 1.6));
      section.style.height = `${sticky.offsetHeight + distance}px`;
      render();
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        render();
      });
    };
    goTo.current = (stage) => {
      const top = window.scrollY + section.getBoundingClientRect().top;
      window.scrollTo({ top: top + at()[stage] * distance, behavior: "smooth" });
    };
    // A slot that is faded out and gets keyboard focus comes into view first.
    const onFocus = (event: FocusEvent) => {
      onScroll();
      const slot = (event.target as HTMLElement).closest<HTMLElement>("[data-slot]");
      if (slot?.hasAttribute("data-cf-inactive")) goTo.current?.(slot.dataset.slot as "form" | "pipeline" | "channels");
    };

    layout();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", layout);
    section.addEventListener("focusin", onFocus);
    section.addEventListener("focusout", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", layout);
      section.removeEventListener("focusin", onFocus);
      section.removeEventListener("focusout", onScroll);
      goTo.current = null;
      delete section.dataset.pinned;
      delete section.dataset.stack;
      section.style.height = "";
      sticky.style.cssText = "";
      for (const slot of Object.values(slots)) {
        slot.removeAttribute("style");
        slot.removeAttribute("data-cf-inactive");
      }
    };
  }, []);

  const onSent = (leadId: string, from: { name: string; email: string }) => {
    cleanup();
    goTo.current?.("pipeline");
    setSender(from);
    setPipeline(runningPipeline);
    timer.current = window.setTimeout(
      () => setPipeline((state) => timeoutPipeline(state)),
      PIPELINE_TIMEOUT_MS,
    );
    void import("@/lib/supabase/browser")
      .then(({ followLead }) =>
        followLead(leadId, (event) => setPipeline((state) => applyEvent(state, event))),
      )
      .then((unsubscribe) => {
        stop.current = unsubscribe;
      })
      // Realtime unavailable: the timeout still shows the reassuring message.
      .catch(() => undefined);
  };

  const again = () => {
    cleanup();
    setPipeline(idlePipeline);
    setSender(null);
    setFormKey((key) => key + 1);
  };

  return (
    <div ref={root} className="scene relative">
      <div
        ref={box}
        className="relative flex flex-col overflow-hidden px-4 py-4 sm:px-[clamp(16px,5vw,72px)] sm:py-6"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <span className="cf-blob cf-blob-accent" style={{ left: "-8%", top: "10%" }} />
          <span className="cf-blob cf-blob-sky" style={{ right: "-10%", top: "25%" }} />
          <span className="cf-blob cf-blob-chaos" style={{ left: "35%", bottom: "-25%" }} />
        </div>
        <div className="relative mx-auto flex min-h-0 w-full max-w-[1280px] flex-1 flex-col gap-3 sm:gap-4">
          {heading}
          <div className="scene-stage min-h-0 flex-1">
            <div data-slot="form" className="min-h-0 will-change-transform">
              <ContactForm
                key={formKey}
                t={t}
                locked={pipeline.status === "running"}
                onSent={onSent}
              />
            </div>
            <div data-slot="pipeline" className="min-h-0 will-change-transform">
              <PipelineView t={t} state={pipeline} sender={sender} onAgain={again} />
            </div>
            <div data-slot="channels" className="min-h-0 will-change-transform">
              {channels}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
