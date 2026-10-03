"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

/**
 * Mutable motion state shared with the scene. The scene eases `value` toward
 * `target` every frame (as the prototype does), so scroll, autoplay and the
 * "back to chaos" button only ever move the target.
 */
export type HeroMotion = {
  target: number;
  value: number;
  pointerX: number;
  pointerY: number;
  smoothX: number;
  smoothY: number;
  /** The visitor scrolled or scrubbed: autoplay must not override them. */
  touched: boolean;
  /** Autoplay already ordered the graph: scrolling back up keeps it ordered. */
  ordered: boolean;
};

export type HeroVariant = "desktop" | "mobile";

const AUTOPLAY_DELAY = 1300;
const RESET_AUTOPLAY_DELAY = 1900;

export function useHeroProgress({
  variant,
  enabled,
  root,
}: {
  variant: HeroVariant;
  enabled: boolean;
  /** Desktop: any element inside the hero section. Mobile: the scene strip. */
  root: RefObject<HTMLElement | null>;
}) {
  const motion = useRef<HeroMotion>({
    target: 0,
    value: 0,
    pointerX: 0,
    pointerY: 0,
    smoothX: 0,
    smoothY: 0,
    touched: false,
    ordered: false,
  });
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  // Autoplay: if nobody scrolls within 1.3 s, order the graph anyway.
  useEffect(() => {
    if (!enabled) return;
    const state = motion.current;
    later(() => {
      if (state.touched) return;
      state.target = 1;
      state.ordered = true;
    }, AUTOPLAY_DELAY);
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, [enabled, later]);

  // Pointer (desktop) or drag (mobile) rotation, normalized to [-1, 1].
  useEffect(() => {
    if (!enabled) return;
    const area =
      variant === "desktop" ? root.current?.closest("section") : root.current;
    if (!area) return;
    const onMove = (event: PointerEvent) => {
      const rect = area.getBoundingClientRect();
      motion.current.pointerX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      motion.current.pointerY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    };
    area.addEventListener("pointermove", onMove);
    return () => area.removeEventListener("pointermove", onMove);
  }, [enabled, variant, root]);

  // Desktop: pin the hero for 100 vh of scroll and map that scroll to progress.
  // GSAP, ScrollTrigger and Lenis load with the scene, never in the initial JS.
  useEffect(() => {
    if (!enabled || variant !== "desktop") return;
    const section = root.current?.closest("section");
    if (!section) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("lenis"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis({ anchors: true });
      lenis.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "+=100%",
        pin: true,
        onUpdate: (self) => {
          const state = motion.current;
          if (self.progress > 0) state.touched = true;
          state.target = state.ordered ? 1 : self.progress;
        },
      });

      // The pin measures the hero once. The agent box grows with each answer:
      // without a re-measure the section keeps its first height and its
      // overflow-hidden clips the fit report.
      let frame = 0;
      const content = section.querySelector<HTMLElement>("[data-hero-content]");
      const resize = new ResizeObserver(() => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => ScrollTrigger.refresh());
      });
      if (content) resize.observe(content);

      cleanup = () => {
        resize.disconnect();
        cancelAnimationFrame(frame);
        trigger.kill();
        gsap.ticker.remove(tick);
        lenis.destroy();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [enabled, variant, root]);

  /** "Volver al caos": back to chaos, then autoplay again unless touched. */
  const reset = useCallback(() => {
    const state = motion.current;
    state.target = 0;
    state.touched = false;
    state.ordered = false;
    later(() => {
      if (state.touched) return;
      state.target = 1;
      state.ordered = true;
    }, RESET_AUTOPLAY_DELAY);
  }, [later]);

  /** Development scrubber: take control and stop autoplay. */
  const scrubTo = useCallback((value: number) => {
    motion.current.touched = true;
    motion.current.ordered = false;
    motion.current.target = value;
  }, []);

  return { motion, reset, scrubTo };
}
