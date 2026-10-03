"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

const DESKTOP_PARTICLES = 20_000;

// Shows the static fallback until the WebGL scene is ready. Deferred loading,
// GPU tiers and reduced motion arrive in tasks 2.5 and 2.6.
export function HeroVisual({
  fallback,
  layers,
  tokens,
}: {
  fallback: ReactNode;
  layers: { label: string; sub: string }[];
  tokens: string[];
}) {
  const progress = useRef(1);
  const [desktop, setDesktop] = useState(false);
  const [ready, setReady] = useState(false);
  const [scrub, setScrub] = useState(100);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const onScrub = (value: number) => {
    setScrub(value);
    progress.current = value / 100;
  };

  return (
    <>
      {!ready && fallback}
      {desktop && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <HeroScene
            progress={progress}
            particleCount={DESKTOP_PARTICLES}
            layers={layers}
            tokens={tokens}
            onReady={() => setReady(true)}
          />
        </div>
      )}
      {process.env.NODE_ENV !== "production" && desktop && (
        // Development-only control for uProgress (task 2.2).
        <label className="absolute bottom-6 right-[clamp(16px,5vw,72px)] z-10 flex items-center gap-3 font-mono text-xs tracking-[0.06em] text-text-3">
          SIMULAR SCROLL · {scrub}%
          <input
            type="range"
            min={0}
            max={100}
            value={scrub}
            onChange={(event) => onScrub(Number(event.target.value))}
            className="h-11 w-[200px] accent-accent"
          />
        </label>
      )}
    </>
  );
}
