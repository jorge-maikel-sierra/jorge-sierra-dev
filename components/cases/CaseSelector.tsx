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

// The card's border says how far the system got (docs/design.md §3): solid
// accent when it is done, dashed while it is being built or only planned.
const statusBorder: Record<CaseStatus, string> = {
  done: "border-accent/70",
  partial: "border-border-strong",
  building: "border-dashed border-warn/70",
  soon: "border-dashed border-border",
};

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
          <div className="min-h-0 flex-1 overflow-y-auto rounded-panel border border-border bg-surface p-4 min-[900px]:p-5">
            {parts.map((part, i) => (
              <div
                key={cases[i].slug}
                id={`case-panel-${cases[i].slug}`}
                hidden={i !== selected}
                className="flex flex-col gap-3 min-[900px]:gap-3.5"
              >
                {part.head}

                <div
                  role="tablist"
                  aria-label={labels.selector}
                  className="flex gap-1 rounded-control border border-border bg-bg p-1 roomy:hidden"
                >
                  {tabs.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={tab === item.id}
                      onClick={() => setTab(item.id)}
                      className={`min-h-10 flex-1 rounded-[6px] px-1 text-[13px] font-semibold ${
                        tab === item.id ? "bg-surface-2 text-text" : "text-text-3 hover:text-text"
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
            className={`group flex h-full w-full flex-col gap-1.5 rounded-card border p-3.5 text-left ${statusBorder[item.status]} ${
              i === selected
                ? "bg-surface-2 ring-1 ring-text-3 ring-offset-2 ring-offset-bg"
                : "bg-surface hover:bg-surface-2"
            }`}
          >
            <span className="text-[13px] leading-[1.3] text-text-3">{item.type}</span>
            <span className="text-[17px] font-bold leading-[1.15] tracking-[-0.01em] text-text">
              {item.title}
            </span>
            <span className="mt-auto">{item.statusBadge}</span>
          </button>
        </div>
      ))}
    </Coverflow>
  );
}
