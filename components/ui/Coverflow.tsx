"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type BlobColor = "accent" | "chaos" | "sky";

/**
 * Scroll-driven 3D coverflow, pinned full screen (task requested by Jorge,
 * 2026-10-12). While the section is pinned, vertical scroll moves the cards
 * horizontally; after the last card it unpins. Without JS or with
 * prefers-reduced-motion the same markup is a plain responsive grid.
 *
 * Children are the cards, each wrapped in an element with `data-cf-item`.
 */
export function Coverflow({
  id,
  header,
  after,
  children,
  palette = ["accent", "chaos", "sky"],
  cardWidth = "min(82vw, 23rem)",
  columns = 3,
  onActiveChange,
}: {
  id: string;
  /** Centered heading block. Must contain the real <h2> the section points to. */
  header: ReactNode;
  after?: ReactNode;
  children: ReactNode;
  palette?: [BlobColor, BlobColor, BlobColor];
  cardWidth?: string;
  columns?: 2 | 3;
  /** The nearest card changed (Math.round(position)). */
  onActiveChange?: (index: number) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const sticky = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const dots = useRef<HTMLDivElement>(null);
  const onActive = useRef(onActiveChange);

  useEffect(() => {
    onActive.current = onActiveChange;
  }, [onActiveChange]);

  useEffect(() => {
    const section = root.current;
    const box = sticky.current;
    const cards = stage.current;
    const dotRow = dots.current;
    if (!section || !box || !cards || !dotRow) return;
    // Reduced motion keeps the fallback grid: no class, no pinning, no blobs.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const items = [...cards.querySelectorAll<HTMLElement>("[data-cf-item]")];
    const n = items.length;
    if (n < 2) return;

    section.classList.add("is-3d");
    dotRow.replaceChildren(
      ...items.map(() => {
        const dot = document.createElement("span");
        dot.className = "cf-dot";
        return dot;
      }),
    );
    const dotEls = [...dotRow.children] as HTMLElement[];

    // The site header is not sticky; if it ever is, the section pins under it.
    const headerHeight = () => {
      const header = document.querySelector("header");
      if (!header) return 0;
      const position = getComputedStyle(header).position;
      return position === "sticky" || position === "fixed"
        ? header.getBoundingClientRect().height
        : 0;
    };

    let header = headerHeight();
    let distance = 1;
    let cardW = 0;
    let active = -1;

    const layout = () => {
      header = headerHeight();
      section.style.setProperty("--header-h", `${header}px`);
      for (const item of items) item.style.height = "auto";
      const tallest = Math.max(...items.map((item) => item.offsetHeight));
      for (const item of items) item.style.height = `${tallest}px`;
      cards.style.height = `${tallest}px`;
      cardW = items[0].offsetWidth;
      const travel = (n - 1) * window.innerHeight * 0.6;
      section.style.height = `${box.offsetHeight + travel}px`;
      distance = Math.max(1, section.offsetHeight - box.offsetHeight);
    };

    const render = () => {
      const top = section.getBoundingClientRect().top;
      const progress = Math.min(1, Math.max(0, (header - top) / distance));
      const position = progress * (n - 1);
      const spread = Math.min(window.innerWidth * 0.36, cardW);
      const phone = window.innerWidth < 640;

      items.forEach((item, i) => {
        const offset = i - position;
        const d = Math.abs(offset);
        const turn = Math.max(-1, Math.min(1, offset)) * -38;
        item.style.transform = `translateX(${offset * spread}px) translateZ(${-d * 180}px) rotateY(${turn}deg)`;
        // Phones: side cards fade fully so their text never shows through the front glass.
        item.style.opacity = String(phone ? Math.max(0, 1 - d * 1.4) : Math.max(0.25, 1 - d * 0.45));
        item.style.zIndex = String(100 - Math.round(d * 10));
        item.style.pointerEvents = d > 0.5 ? "none" : "";
        // WCAG 1.4.3 exempts inactive components: side cards are faded on
        // purpose and become active (full contrast) once centered.
        item.toggleAttribute("data-cf-inactive", d > 0.5);
      });

      const nearest = Math.round(position);
      if (nearest !== active) {
        active = nearest;
        dotEls.forEach((dot, i) => dot.classList.toggle("is-active", i === nearest));
        onActive.current?.(nearest);
      }
    };

    let ticking = false;
    let inView = false;
    const schedule = () => {
      if (ticking || !inView) return;
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

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) schedule();
    });
    observer.observe(section);

    // Tabbing into a card brings it to the center.
    const onFocus = (event: FocusEvent) => {
      const index = items.findIndex((item) => item.contains(event.target as Node));
      if (index < 0) return;
      const rect = section.getBoundingClientRect();
      window.scrollTo({
        top: window.scrollY + rect.top - header + (index / (n - 1)) * distance,
      });
    };

    const images = [...cards.querySelectorAll("img")];
    relayout();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", relayout);
    images.forEach((image) => image.addEventListener("load", relayout));
    cards.addEventListener("focusin", onFocus);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", relayout);
      images.forEach((image) => image.removeEventListener("load", relayout));
      cards.removeEventListener("focusin", onFocus);
      section.classList.remove("is-3d");
      section.style.height = "";
      cards.style.height = "";
      for (const item of items) {
        item.removeAttribute("style");
        item.removeAttribute("data-cf-inactive");
      }
      dotRow.replaceChildren();
    };
  }, []);

  return (
    <div
      ref={root}
      id={id}
      data-coverflow=""
      data-columns={columns}
      style={{ "--cf-w": cardWidth } as CSSProperties}
      className="cf"
    >
      <div ref={sticky} className="cf-sticky">
        <div className="cf-blobs" aria-hidden="true">
          {palette.map((color, i) => (
            <span key={i} className={`cf-blob cf-blob-${color}`} />
          ))}
        </div>
        <div className="cf-container">
          {header}
          <div ref={stage} className="cf-stage">
            {children}
          </div>
          <div ref={dots} className="cf-dots" aria-hidden="true" />
          {after}
        </div>
      </div>
    </div>
  );
}
