"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Coverflow } from "@/components/ui/Coverflow";
import type { AreaId } from "@/lib/content/schema";

export type ExperienceCard = {
  id: string;
  /** Areas of a role; empty for the education and how-I-work cards. */
  areas: AreaId[];
  current: boolean;
  meta: ReactNode;
  title: ReactNode;
  sub: ReactNode;
  detail: ReactNode;
  announce: string;
};

type Filter = AreaId | "all";

// Experience as a pinned 3D coverflow, like the case studies: scrolling moves
// the cards (roles, then education and how I work), the detail below follows
// the centered one, and the closing buttons stay in sight. The area filter only
// sets data-filter; globals.css dims the roles outside the area.
export function ExperienceSelector({
  areas,
  cards,
  heading,
  footer,
  labels,
}: {
  areas: { id: AreaId; label: string }[];
  cards: ExperienceCard[];
  heading: ReactNode;
  footer: ReactNode;
  labels: { filterGroup: string; all: string; current: string; highlighted: string };
}) {
  const [selected, setSelected] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [announcement, setAnnouncement] = useState("");
  const current = useRef(0);
  const settle = useRef<number | undefined>(undefined);
  const total = cards.length;

  const select = useCallback(
    (index: number) => {
      const next = (index + total) % total;
      if (current.current === next) return;
      current.current = next;
      setSelected(next);
      setAnnouncement(cards[next].announce);
    },
    [cards, total],
  );

  // The detail follows the centered card once the scroll settles.
  const follow = useCallback(
    (index: number) => {
      window.clearTimeout(settle.current);
      settle.current = window.setTimeout(() => select(index), 120);
    },
    [select],
  );
  useEffect(() => () => window.clearTimeout(settle.current), []);

  const choose = (index: number) => {
    select(index);
    const pinned = document.getElementById("trayectoria-coverflow")?.classList.contains("is-3d");
    if (!pinned) document.getElementById(`exp-panel-${cards[index].id}`)?.scrollIntoView({ block: "start" });
  };

  const options: { id: Filter; label: string }[] = [{ id: "all", label: labels.all }, ...areas];
  const roleCards = cards.filter((card) => card.areas.length > 0);
  const matching =
    filter === "all" ? roleCards.length : roleCards.filter((card) => card.areas.includes(filter)).length;

  return (
    <div data-filter={filter}>
      <Coverflow
        id="trayectoria-coverflow"
        cardWidth="min(78vw, 17rem)"
        onActiveChange={follow}
        header={
          <>
            {heading}
            <div
              role="group"
              aria-label={labels.filterGroup}
              className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
            >
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={option.id === filter}
                  onClick={() => setFilter(option.id)}
                  className={`min-h-10 shrink-0 whitespace-nowrap rounded-full border px-3.5 font-mono text-xs tracking-[0.04em] sm:px-[18px] sm:text-[13px] ${
                    option.id === filter
                      ? "border-accent bg-accent text-bg"
                      : "border-border-strong bg-transparent text-text"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p aria-live="polite" className="sr-only">
              {filter === "all"
                ? ""
                : labels.highlighted
                    .replace("{count}", String(matching))
                    .replace("{total}", String(roleCards.length))}
            </p>
          </>
        }
        after={
          <>
            <p aria-live="polite" className="sr-only">
              {announcement}
            </p>
            <div className="min-h-0 flex-1 overflow-y-auto rounded-[18px] border border-border bg-surface/90 p-4 backdrop-blur-sm min-[900px]:p-5">
              {cards.map((card, i) => (
                <div
                  key={card.id}
                  id={`exp-panel-${card.id}`}
                  hidden={i !== selected}
                  data-role=""
                  data-areas={card.areas.join(" ")}
                >
                  {card.detail}
                </div>
              ))}
            </div>
            <div className="mt-3 shrink-0">{footer}</div>
          </>
        }
      >
        {cards.map((card, i) => (
          <div key={card.id} data-cf-item="" data-role="" data-areas={card.areas.join(" ")}>
            <button
              type="button"
              aria-pressed={i === selected}
              aria-controls={`exp-panel-${card.id}`}
              onClick={() => choose(i)}
              className={`flex h-full w-full flex-col gap-1.5 rounded-card border p-3 text-left shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-colors duration-300 motion-reduce:transition-none ${
                i === selected
                  ? "border-accent bg-[rgba(15,17,20,0.9)]"
                  : "border-white/10 bg-[rgba(12,13,16,0.78)] hover:border-border-strong"
              }`}
            >
              <span
                className={`flex w-full flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-[0.06em] ${
                  card.current ? "text-accent" : "text-text-3"
                }`}
              >
                <span>{card.meta}</span>
                {card.current && (
                  <span data-current-badge="" className="rounded-full bg-accent px-1.5 py-px text-bg">
                    {labels.current}
                  </span>
                )}
              </span>
              <span className="text-base font-bold leading-[1.15] tracking-[-0.01em] text-text">
                {card.title}
              </span>
              <span className="mt-auto line-clamp-2 text-[13px] leading-snug text-text-2">{card.sub}</span>
            </button>
          </div>
        ))}
      </Coverflow>
    </div>
  );
}
