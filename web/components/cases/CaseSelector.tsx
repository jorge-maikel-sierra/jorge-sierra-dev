"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
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
};

type Labels = {
  selector: string;
  previous: string;
  next: string;
  previousLabel: string;
  nextLabel: string;
};

const statusBorder = "border-accent bg-surface-2";

// Cards on desktop, horizontal snap carousel on mobile. Details and stacks are
// rendered on the server and only toggled here; without JS the first case shows.
export function CaseSelector({
  cases,
  details,
  stacks,
  labels,
}: {
  cases: CaseSummary[];
  details: ReactNode[];
  stacks: ReactNode[];
  labels: Labels;
}) {
  const [selected, setSelected] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const total = cases.length;

  const select = (index: number, focus = false) => {
    const next = (index + total) % total;
    setSelected(next);
    setAnnouncement(cases[next].announce);
    if (focus) {
      buttons.current[next]?.focus();
      buttons.current[next]?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: total - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    select(moves[event.key], true);
  };

  return (
    <>
      <div
        role="group"
        aria-label={labels.selector}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-2.5 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] sm:gap-3 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {cases.map((item, i) => {
          const active = i === selected;
          return (
            <button
              key={item.slug}
              ref={(node) => {
                buttons.current[i] = node;
              }}
              type="button"
              aria-pressed={active}
              aria-controls={`case-panel-${item.slug}`}
              tabIndex={active ? 0 : -1}
              onClick={() => select(i)}
              onKeyDown={(event) => onKeyDown(event, i)}
              className={`flex min-h-[132px] flex-[0_0_232px] snap-start flex-col gap-2 rounded-card border p-4 text-left text-text sm:min-h-[172px] sm:gap-2.5 sm:p-5 ${
                active ? statusBorder : "border-border bg-transparent"
              }`}
            >
              <span
                className={`flex w-full justify-between gap-2 font-mono text-[11px] uppercase tracking-[0.06em] sm:gap-3 sm:text-xs ${
                  active ? "text-accent" : "text-text-muted"
                }`}
              >
                <span>{item.num}</span>
                <span>{item.type}</span>
              </span>
              <span className="text-lg font-bold leading-[1.15] sm:text-[21px] sm:tracking-[-0.01em]">
                {item.title}
              </span>
              <span className="hidden text-sm leading-[1.4] text-text-3 sm:block">
                {item.kicker}
              </span>
              <span className="mt-auto">{item.statusBadge}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-7 rounded-[18px] border border-border bg-surface px-4 py-5 sm:gap-9 sm:rounded-[20px] sm:p-[clamp(20px,3vw,40px)]">
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
    </>
  );
}
