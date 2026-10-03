"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { detectGpuTier } from "./gpuTier";
import { useHeroProgress, type HeroVariant } from "./useHeroProgress";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

// docs/design.md §4: 20 000 on desktop with GPU tier ≥ 2; 8 000 on tier 1 and
// on mobile; static fallback on tier 0 and with prefers-reduced-motion.
const particlesFor = (variant: HeroVariant, tier: number) =>
  variant === "desktop" && tier >= 2 ? 20_000 : 8_000;
const MEDIA: Record<HeroVariant, string> = {
  desktop: "(min-width: 640px)",
  mobile: "(max-width: 639.98px)",
};

type Labels = {
  stateChaos: string;
  stateOrdering: string;
  stateArchitecture: string;
  backToChaos: string;
};

// Shows the static fallback until the WebGL scene is ready. Desktop: canvas
// behind the hero copy, pinned scroll. Mobile: its own strip with the status
// line and "Volver al caos". Deferred mounting after the LCP: task 2.6.
export function HeroVisual({
  variant,
  fallback,
  layers,
  tokens,
  labels,
}: {
  variant: HeroVariant;
  fallback: ReactNode;
  layers: { label: string; sub: string }[];
  tokens: string[];
  labels: Labels;
}) {
  const root = useRef<HTMLDivElement>(null);
  const status = useRef<HTMLSpanElement>(null);
  const [matches, setMatches] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [tier, setTier] = useState<number | null>(null);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const active = matches && !reducedMotion && tier !== null && tier > 0;
  const [scrub, setScrub] = useState(0);
  const { motion, reset, scrubTo } = useHeroProgress({ variant, enabled: active, root });

  useEffect(() => {
    const viewport = window.matchMedia(MEDIA[variant]);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setMatches(viewport.matches);
      setReducedMotion(motion.matches);
    };
    update();
    viewport.addEventListener("change", update);
    motion.addEventListener("change", update);
    return () => {
      viewport.removeEventListener("change", update);
      motion.removeEventListener("change", update);
    };
  }, [variant]);

  // Only probe the GPU when this variant can actually show the scene.
  useEffect(() => {
    if (!matches || reducedMotion || tier !== null) return;
    let cancelled = false;
    void detectGpuTier().then((value) => {
      if (!cancelled) setTier(value);
    });
    return () => {
      cancelled = true;
    };
  }, [matches, reducedMotion, tier]);

  // Pause rendering while the scene is off screen.
  useEffect(() => {
    const target =
      variant === "desktop" ? root.current?.closest("section") : root.current;
    if (!active || !target) return;
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [active, variant]);

  const scene = active && (
    <HeroScene
      motion={motion}
      variant={variant}
      particleCount={particlesFor(variant, tier ?? 1)}
      paused={!visible}
      layers={layers}
      tokens={tokens}
      status={
        variant === "mobile"
          ? {
              element: status,
              labels: {
                chaos: labels.stateChaos,
                ordering: labels.stateOrdering,
                architecture: labels.stateArchitecture,
              },
            }
          : undefined
      }
      onReady={() => setReady(true)}
    />
  );

  if (variant === "mobile") {
    return (
      <div ref={root} className="absolute inset-0 touch-pan-y">
        {!(active && ready) && (
          <div className="flex h-full items-center justify-center">{fallback}</div>
        )}
        {scene && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            {scene}
          </div>
        )}
        {active && ready && (
          <div className="absolute inset-x-4 bottom-2 flex items-center justify-between gap-3 font-mono text-[11px] tracking-[0.06em] text-text-3">
            <span ref={status} aria-hidden="true" className="group flex items-center gap-2">
              <span className="size-2 rounded-full bg-chaos group-data-[state=architecture]:bg-accent group-data-[state=ordering]:bg-text" />
              <span data-status-text="">{labels.stateChaos} · 0%</span>
            </span>
            <button
              type="button"
              onClick={reset}
              className="min-h-11 rounded-full border border-border-strong bg-[rgba(7,8,10,0.75)] px-3.5 text-[11px] tracking-[0.06em] text-text"
            >
              {labels.backToChaos}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={root} className="contents">
      {!(active && ready) && fallback}
      {scene && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {scene}
        </div>
      )}
      {process.env.NODE_ENV !== "production" && active && (
        // Development-only scrubber for uProgress (task 2.2).
        <label className="absolute bottom-6 right-[clamp(16px,5vw,72px)] z-10 flex items-center gap-3 font-mono text-xs tracking-[0.06em] text-text-3">
          SIMULAR SCROLL · {scrub}%
          <input
            type="range"
            min={0}
            max={100}
            value={scrub}
            onChange={(event) => {
              const value = Number(event.target.value);
              setScrub(value);
              scrubTo(value / 100);
            }}
            className="h-11 w-[200px] accent-accent"
          />
        </label>
      )}
    </div>
  );
}
