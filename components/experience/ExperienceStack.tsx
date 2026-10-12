"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { AreaId } from "@/lib/content/schema";

export type ExperienceCard = {
  id: string;
  /** Areas of a role; empty for the education and how-I-work cards. */
  areas: AreaId[];
  current: boolean;
  icon: ReactNode;
  meta: ReactNode;
  title: ReactNode;
  sub: ReactNode;
  detail: ReactNode;
  announce: string;
};

type Filter = AreaId | "all";

// Experience as a pinned screen with a vertical rail of cards: scrolling walks
// down the rail (roles, then education and how I work) and the detail panel
// follows the active card; a click jumps to a card. On phones the rail becomes
// a horizontal strip. Without motion the section is not pinned and a click
// just selects. The area filter only sets data-filter; globals.css dims roles.
export function ExperienceStack({
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
  const root = useRef<HTMLDivElement>(null);
  const sticky = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLOListElement>(null);
  const goToRef = useRef<((index: number, behavior: ScrollBehavior) => void) | null>(null);
  const total = cards.length;

  useEffect(() => {
    const section = root.current;
    const box = sticky.current;
    if (!section || !box) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    section.dataset.pinned = "";
    box.style.cssText = "position:sticky;top:0;height:max(100svh,600px)";
    let distance = 1;
    let active = 0;

    const layout = () => {
      distance = Math.max(1, (total - 1) * window.innerHeight * 0.55);
      section.style.height = `${box.offsetHeight + distance}px`;
    };
    const render = () => {
      const progress = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / distance));
      section.style.setProperty("--xp-progress", String(progress));
      const next = Math.round(progress * (total - 1));
      if (next !== active) {
        active = next;
        setSelected(next);
      }
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
    const relayout = () => {
      layout();
      render();
    };

    goToRef.current = (index, behavior) => {
      const top = window.scrollY + section.getBoundingClientRect().top;
      window.scrollTo({ top: top + (index / (total - 1)) * distance, behavior });
    };
    relayout();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", relayout);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", relayout);
      goToRef.current = null;
      delete section.dataset.pinned;
      section.style.height = "";
      box.style.cssText = "";
    };
  }, [total]);

  // Keep the active card in sight when the rail is a horizontal strip.
  useEffect(() => {
    const list = strip.current;
    const item = list?.children[selected] as HTMLElement | undefined;
    if (!list || !item || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: item.offsetLeft - (list.clientWidth - item.offsetWidth) / 2, behavior: "smooth" });
  }, [selected]);

  const choose = useCallback((index: number) => {
    if (goToRef.current) goToRef.current(index, "smooth");
    else setSelected(index);
  }, []);

  const options: { id: Filter; label: string }[] = [{ id: "all", label: labels.all }, ...areas];
  const roleCards = cards.filter((card) => card.areas.length > 0);
  const matching =
    filter === "all" ? roleCards.length : roleCards.filter((card) => card.areas.includes(filter)).length;

  return (
    <div
      ref={root}
      id="trayectoria-stack"
      data-filter={filter}
      style={{ "--xp-progress": 0 } as CSSProperties}
      className="relative"
    >
      <div ref={sticky} className="flex flex-col gap-2.5 overflow-hidden px-4 py-3 sm:px-[clamp(16px,5vw,72px)] sm:py-5">
        <div className="mx-auto flex min-h-0 w-full max-w-[1280px] flex-1 flex-col gap-2.5 sm:gap-3">
          {heading}
          <div
            role="group"
            aria-label={labels.filterGroup}
            className="-mx-4 flex shrink-0 gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
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

          <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-3 min-[700px]:grid-cols-[minmax(0,clamp(240px,30vw,340px))_minmax(0,1fr)] min-[700px]:grid-rows-1 min-[700px]:gap-6">
            <div className="relative min-w-0 self-start">
              <span
                aria-hidden="true"
                className="absolute bottom-6 left-[35px] top-6 hidden w-px bg-rail min-[700px]:block"
              >
                <span
                  className="block size-full origin-top bg-accent"
                  style={{ transform: "scaleY(var(--xp-progress))" }}
                />
              </span>
              <ol
                ref={strip}
                className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] min-[700px]:mx-0 min-[700px]:flex-col min-[700px]:gap-2.5 min-[700px]:overflow-visible min-[700px]:px-0 min-[700px]:pb-0 [&::-webkit-scrollbar]:hidden"
              >
                {cards.map((card, i) => (
                  <li
                    key={card.id}
                    data-role=""
                    data-areas={card.areas.join(" ")}
                    data-xp-card=""
                    className="relative flex shrink-0 min-[700px]:shrink"
                  >
                    <button
                      type="button"
                      aria-pressed={i === selected}
                      aria-controls={`exp-panel-${card.id}`}
                      onClick={() => choose(i)}
                      onFocus={() => goToRef.current?.(i, "auto")}
                      className={`flex w-[10.5rem] items-center gap-2 rounded-card border p-2 text-left transition-all duration-300 motion-reduce:transition-none min-[700px]:w-full min-[700px]:gap-3 min-[700px]:p-3 ${
                        i === selected
                          ? "border-accent bg-surface-2 shadow-[0_0_0_1px_var(--accent),0_18px_40px_-20px_rgba(110,240,176,0.45)] min-[700px]:translate-x-1.5"
                          : "border-border bg-surface hover:border-border-strong"
                      }`}
                    >
                      <span
                        className={`grid size-9 shrink-0 place-items-center rounded-xl border min-[700px]:size-11 ${
                          i === selected
                            ? "border-accent bg-accent text-bg"
                            : "border-border-strong bg-bg text-text-2"
                        }`}
                      >
                        {card.icon}
                      </span>
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span
                          className={`hidden flex-wrap items-center gap-x-2 font-mono text-[10px] uppercase tracking-[0.05em] min-[700px]:flex min-[700px]:text-[11px] ${
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
                        <span className="line-clamp-2 text-[13px] font-bold leading-[1.15] text-text min-[700px]:text-base">
                          {card.title}
                        </span>
                        <span className="hidden truncate text-[13px] text-text-2 min-[700px]:block">{card.sub}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            <div className="min-h-0 overflow-y-auto rounded-[20px] border border-border bg-[radial-gradient(120%_80%_at_0%_0%,rgba(110,240,176,0.07),transparent_55%),var(--surface)] p-4 min-[700px]:p-5">
              <p aria-live="polite" className="sr-only">
                {cards[selected].announce}
              </p>
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
          </div>

          <div className="shrink-0">{footer}</div>
        </div>
      </div>
    </div>
  );
}
