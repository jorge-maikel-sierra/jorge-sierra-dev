"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Coverflow } from "@/components/ui/Coverflow";
import type { CaseStatus } from "@/lib/content/schema";
import type { CaseParts } from "./CaseDetail";

export type CaseSummary = {
  slug: string;
  num: string;
  title: ReactNode;
  type: ReactNode;
  status: CaseStatus;
  statusBadge: ReactNode;
  announce: string;
};

type Labels = {
  selector: string;
  tabs: Record<Tab, string>;
};

type Tab = "flow" | "problem" | "decisions" | "results";

// Cases as a pinned 3D coverflow with the whole detail on the same screen:
// cards on top (scroll or click to bring one forward), detail below. Columns on
// desktop; tabs below 900 px. Without JS or with reduced motion it is a grid
// followed by the detail.
export function CaseSelector({
  cases,
  parts,
  labels,
  header,
  footer,
}: {
  cases: CaseSummary[];
  parts: CaseParts[];
  labels: Labels;
  header: ReactNode;
  /** Closing call to action, shown under the detail on small screens. */
  footer: ReactNode;
}) {
  const [selected, setSelected] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const [tab, setTab] = useState<Tab>("flow");
  const current = useRef(0);
  const settle = useRef<number | undefined>(undefined);
  const total = cases.length;

  const select = useCallback(
    (index: number) => {
      const next = (index + total) % total;
      if (current.current === next) return;
      current.current = next;
      setSelected(next);
      setAnnouncement(cases[next].announce);
    },
    [cases, total],
  );

  // The detail follows the centered card, but only once the scroll settles:
  // jumping from card 1 to 5 must not flash through the cases in between.
  const follow = useCallback(
    (index: number) => {
      window.clearTimeout(settle.current);
      settle.current = window.setTimeout(() => select(index), 120);
    },
    [select],
  );
  useEffect(() => () => window.clearTimeout(settle.current), []);

  // Pressing a card that is already centered (or any card in the plain grid).
  const choose = (index: number) => {
    select(index);
    const pinned = document.querySelector("[data-coverflow]")?.classList.contains("is-3d");
    // In the plain grid the detail sits below the cards: bring it into view.
    if (!pinned) {
      document.getElementById(`case-panel-${cases[index].slug}`)?.scrollIntoView({ block: "start" });
    }
  };

  const tabs = (Object.keys(labels.tabs) as Tab[]).map((id) => ({ id, label: labels.tabs[id] }));
  // Tabs unless the screen is wide and tall enough (see the roomy variant).
  const show = (id: Tab) => (tab === id ? "" : "cozy:hidden");

  return (
    <Coverflow
      id="casos-coverflow"
      header={header}
      cardWidth="min(78vw, 17rem)"
      onActiveChange={follow}
      after={
        <>
          <p aria-live="polite" className="sr-only">
            {announcement}
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto rounded-[18px] border border-border bg-surface/90 p-4 backdrop-blur-sm min-[900px]:p-5">
            {parts.map((part, i) => (
              <div
                key={cases[i].slug}
                id={`case-panel-${cases[i].slug}`}
                hidden={i !== selected}
                className="flex flex-col gap-3 min-[900px]:gap-3.5"
              >
                {part.head}

                <div role="tablist" aria-label={labels.selector} className="flex gap-1.5 roomy:hidden">
                  {tabs.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={tab === item.id}
                      onClick={() => setTab(item.id)}
                      className={`min-h-10 flex-1 rounded-full border px-1 font-mono text-[10px] uppercase tracking-[0.02em] ${
                        tab === item.id
                          ? "border-accent bg-surface-2 text-accent"
                          : "border-border text-text-3"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-4 roomy:grid-cols-3 roomy:gap-x-6 roomy:gap-y-3.5">
                  <div className={`roomy:col-span-3 ${show("flow")}`}>{part.flow}</div>
                  <div className={show("problem")}>{part.problem}</div>
                  <div className={show("decisions")}>{part.decisions}</div>
                  <div className={show("results")}>{part.results}</div>
                  <div className={`roomy:col-span-3 ${show("results")}`}>{part.stack}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 min-[900px]:hidden">{footer}</div>
        </>
      }
    >
      {cases.map((item, i) => (
        <div key={item.slug} data-cf-item="">
          <button
            type="button"
            aria-pressed={i === selected}
            aria-controls={`case-panel-${item.slug}`}
            onClick={() => choose(i)}
            className={`group flex h-full w-full flex-col gap-1.5 rounded-card border p-3 text-left shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-colors duration-300 motion-reduce:transition-none ${
              i === selected
                ? "border-accent bg-[rgba(15,17,20,0.9)]"
                : "border-white/10 bg-[rgba(12,13,16,0.78)] hover:border-border-strong"
            }`}
          >
            <span className="flex w-full justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.06em]">
              <span className="text-accent">{item.num}</span>
              <span className="text-right text-text-3">{item.type}</span>
            </span>
            <span className="text-base font-bold leading-[1.15] tracking-[-0.01em] text-text">
              {item.title}
            </span>
            <span className="mt-auto">{item.statusBadge}</span>
          </button>
        </div>
      ))}
    </Coverflow>
  );
}
