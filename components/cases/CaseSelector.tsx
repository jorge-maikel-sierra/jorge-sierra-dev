"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { Coverflow } from "@/components/ui/Coverflow";
import type { CaseStatus } from "@/lib/content/schema";

export type CaseSummary = {
  slug: string;
  num: string;
  title: ReactNode;
  type: ReactNode;
  kicker: ReactNode;
  status: CaseStatus;
  statusBadge: ReactNode;
  announce: string;
  /** The case's real data flow, shown on the card instead of an image. */
  flow: { tag: string; name: ReactNode }[];
};

type Labels = {
  selector: string;
  previous: string;
  next: string;
  previousLabel: string;
  nextLabel: string;
  viewCase: string;
};

/** Top of each card: the case's flow as a small node diagram (no images exist). */
function MiniFlow({ flow, planned }: { flow: CaseSummary["flow"]; planned: boolean }) {
  return (
    <div className="relative flex aspect-[16/7] items-center border-b border-white/10 bg-[radial-gradient(120%_100%_at_0%_0%,rgba(110,240,176,0.10),transparent_60%)] px-4">
      <span
        aria-hidden="true"
        className={`absolute inset-x-8 top-1/2 h-px ${planned ? "border-t border-dashed border-text-muted" : "bg-accent/40"}`}
      />
      {/* Labels alternate above and below the line so long tags never collide. */}
      <ol className="relative flex w-full justify-between">
        {flow.map((node, i) => (
          <li key={node.tag} className="relative flex w-0 flex-1 justify-center">
            <span
              aria-hidden="true"
              className={`size-3 rounded-full border ${planned ? "border-dashed border-text-muted bg-bg" : "border-accent bg-accent/30"}`}
            />
            <span
              className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.06em] text-text-3 sm:text-[10px] ${i % 2 ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]"}`}
            >
              {node.tag}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// Cases as a pinned 3D coverflow (grid without JS or with reduced motion).
// The detail of the centered card is rendered below; details and stacks are
// rendered on the server and only toggled here.
export function CaseSelector({
  cases,
  details,
  stacks,
  labels,
  header,
}: {
  cases: CaseSummary[];
  details: ReactNode[];
  stacks: ReactNode[];
  labels: Labels;
  header: ReactNode;
}) {
  const [selected, setSelected] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const total = cases.length;

  const select = useCallback(
    (index: number) => {
      const next = (index + total) % total;
      setSelected(next);
      setAnnouncement(cases[next].announce);
    },
    [cases, total],
  );

  // The detail follows the centered card, except right after an explicit
  // choice: jumping to the panel scrolls through the rest of the coverflow,
  // which would otherwise move the selection to the last card.
  const jumping = useRef(false);
  const jumpTimer = useRef<number | undefined>(undefined);
  const choose = (index: number) => {
    jumping.current = true;
    window.clearTimeout(jumpTimer.current);
    jumpTimer.current = window.setTimeout(() => {
      jumping.current = false;
    }, 1500);
    select(index);
  };
  const follow = useCallback(
    (index: number) => {
      if (!jumping.current) select(index);
    },
    [select],
  );

  return (
    <>
      <Coverflow id="casos-coverflow" header={header} onActiveChange={follow}>
        {cases.map((item, i) => (
          <div key={item.slug} data-cf-item="">
            <article className="group flex h-full flex-col overflow-hidden rounded-card border border-white/10 bg-[rgba(12,13,16,0.78)] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none">
              <span
                aria-hidden="true"
                className="h-1 bg-gradient-to-r from-chaos via-text to-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <MiniFlow flow={item.flow} planned={item.status === "soon"} />
              <div className="flex flex-1 flex-col gap-2.5 p-5">
                <p className="flex justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.06em] text-accent sm:text-xs">
                  <span>{item.num}</span>
                  <span className="text-right text-text-3">{item.type}</span>
                </p>
                <h3 className="text-xl font-bold leading-[1.15] tracking-[-0.01em] text-text sm:text-[22px]">
                  {item.title}
                </h3>
                <p className="text-sm leading-[1.45] text-text-2">{item.kicker}</p>
                <span>{item.statusBadge}</span>
                <a
                  href={`#case-panel-${item.slug}`}
                  onClick={() => choose(i)}
                  className="mt-auto inline-flex min-h-11 items-center gap-1.5 self-start pt-2 text-sm font-semibold text-accent underline-offset-4 hover:underline"
                >
                  {labels.viewCase}
                  <span className="sr-only">: {cases[i].announce}</span>
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </article>
          </div>
        ))}
      </Coverflow>

      <div className="mx-auto w-full max-w-[1280px] px-4 pt-10 sm:px-[clamp(16px,5vw,72px)] sm:pt-14">
      <div className="flex scroll-mt-6 flex-col gap-7 rounded-[18px] border border-border bg-surface px-4 py-5 sm:gap-9 sm:rounded-[20px] sm:p-[clamp(20px,3vw,40px)]">
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
        {details.map((detail, i) => (
          <div
            key={cases[i].slug}
            id={`case-panel-${cases[i].slug}`}
            hidden={i !== selected}
          >
            {detail}
          </div>
        ))}

        <div className="flex flex-col gap-7 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:border-t sm:border-[#1c1e22] sm:pt-5">
          {stacks.map((stack, i) => (
            <div key={cases[i].slug} hidden={i !== selected}>
              {stack}
            </div>
          ))}
        <nav
          aria-label={labels.selector}
          className="flex items-center gap-2 border-t border-[#1c1e22] pt-4 sm:gap-2.5 sm:border-0 sm:pt-0"
        >
          <button
            type="button"
            onClick={() => select(selected - 1)}
            className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border-strong text-lg text-text sm:h-auto sm:min-h-11 sm:w-auto sm:px-4 sm:font-mono sm:text-xs sm:uppercase sm:tracking-[0.06em]"
          >
            <span aria-hidden="true" className="sm:hidden">
              ←
            </span>
            <span className="sr-only sm:not-sr-only">
              <span className="sm:hidden">{labels.previousLabel}</span>
              <span className="hidden sm:inline">{labels.previous}</span>
            </span>
          </button>
          <span className="flex-1 text-center font-mono text-xs tracking-[0.08em] text-text-3 sm:hidden">
            {selected + 1} / {total}
          </span>
          <button
            type="button"
            onClick={() => select(selected + 1)}
            className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border-strong text-lg text-text sm:h-auto sm:min-h-11 sm:w-auto sm:px-4 sm:font-mono sm:text-xs sm:uppercase sm:tracking-[0.06em]"
          >
            <span aria-hidden="true" className="sm:hidden">
              →
            </span>
            <span className="sr-only sm:not-sr-only">
              <span className="sm:hidden">{labels.nextLabel}</span>
              <span className="hidden sm:inline">{labels.next}</span>
            </span>
          </button>
        </nav>
        </div>
      </div>
      </div>
    </>
  );
}
