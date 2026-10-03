"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useHeroProgress, type HeroVariant } from "./useHeroProgress";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

const PARTICLES: Record<HeroVariant, number> = { desktop: 20_000, mobile: 8_000 };
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
// line and "Volver al caos". GPU tiers and deferred mounting: tasks 2.5 and 2.6.
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
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const [scrub, setScrub] = useState(0);
  const { motion, reset, scrubTo } = useHeroProgress({ variant, enabled: active, root });

  useEffect(() => {
    const query = window.matchMedia(MEDIA[variant]);
    const update = () => setActive(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [variant]);

  const scene = active && (
    <HeroScene
      motion={motion}
      variant={variant}
      particleCount={PARTICLES[variant]}
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
        {!ready && (
          <div className="flex h-full items-center justify-center">{fallback}</div>
        )}
        {scene && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            {scene}
          </div>
        )}
        {ready && (
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
      {!ready && fallback}
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
